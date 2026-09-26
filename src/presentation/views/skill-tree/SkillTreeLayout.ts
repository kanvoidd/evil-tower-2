import type { ClassId, TalentPath, TalentTab } from '../../../domain/catalog';
import type { BranchedTree, TieredTree, Tree, TreeNode } from '../../../domain/progression';
import type { Point } from '../../animations/interfaces/Point';
import type { TreeBounds } from './interfaces/TreeBounds';

/**
 * Раскладка дерева навыков: координаты узлов в «мире» дерева (до масштаба вида). Правилам
 * прокачки координаты не нужны — у узла там только уровень; экранная геометрия живёт здесь.
 *
 * Таланты под способностью лежат не столбиком, а неровным блоком, как в дереве WoW: цепочка
 * каждого пути петляет вокруг своей оси, пути начинаются на разной высоте. Порядок сверху вниз
 * сохраняется: узел следующего уровня всегда ниже предыдущего.
 *
 * Дерево с ярусами: блок класса идёт сверху вниз — карточка класса, стартовая способность, три
 * яруса талантов по путям (урон слева, здоровье по центру, защита справа) с воротами-способностями
 * между ярусами, легенда; финальные классы — два блока по сторонам под воротами.
 * Дерево с ветками: «Профессия» — базовый класс, под ним подклассы в ряд, у каждого ветки
 * столбцами (способности — на оси ветки, их таланты — вразнобой рядом), ниже — переходный класс
 * со своими ветками; «Основа» — ярусы талантов по путям. У каждой вкладки свои границы: на экране
 * видна одна.
 */
export class SkillTreeLayout {
  private static readonly GAP = {
    /** От карточки класса до стартовой способности. */
    startPerk: 160,
    /** От способности до первого таланта яруса и от последнего таланта до следующей способности. */
    gate: 158,
    /** Шаг между талантами внутри цепочки (плитка 108 + зазор под значок ранга). */
    step: 142,
    /** Разнос путей по горизонтали: с запасом под петли цепочек. */
    pathDx: 230,
    /** Разнос веток подкласса: таланты ветки уходят от её оси в стороны. */
    branchDx: 290,
    /** Зазор между блоками классов и вокруг ворот эволюции. */
    blockGap: 225,
    /** Сдвиг блоков финальных классов от центра. */
    terminalDx: 620,
    /** Сдвиг подклассов от центра. */
    subclassDx: 760,
  };

  private static readonly PATH_SLOT: Record<TalentPath, number> = {
    attack: -1,
    vitality: 0,
    guard: 1,
  };

  /**
   * Петли цепочки пути: сдвиг таланта от оси пути (доля `LOOP`) по номеру в цепочке — у каждого
   * пути свой рисунок, чтобы блок яруса не читался столбиками.
   */
  private static readonly LOOP_PATTERN: Record<TalentPath, readonly number[]> = {
    attack: [0.2, -0.9, 0.7, -0.4],
    vitality: [-0.6, 0.5, -0.2, 0.9],
    guard: [0.8, -0.3, 0.6, -0.8],
  };
  /** Размах петель пути (узел 108, между осями путей 230 — соседи не наезжают). */
  private static readonly LOOP = 62;
  /**
   * С какой высоты начинается путь в блоке яруса (доля шага): пути не стоят в одну строку. Какой
   * путь берёт какую высоту, меняется от яруса к ярусу.
   */
  private static readonly PATH_PHASES: readonly number[] = [0, 0.45, 0.2];
  /** Таланты ветки — по сторонам от её оси: сторона и доля размаха по номеру таланта после способности. */
  private static readonly BRANCH_PATTERN: readonly number[] = [1, -0.8, 0.5, -1];
  private static readonly BRANCH_LOOP = 75;

  private readonly points = new Map<string, Point>();
  private readonly tabBounds = new Map<TalentTab, TreeBounds>();

  constructor(private readonly tree: Tree) {
    if (tree.shape === 'tiered') this.tiered(tree);
    else {
      this.profession(tree);
      this.baseTab();
    }
    for (const tab of ['profession', 'base'] as const) {
      const all = tree.nodes.filter((n) => n.tab === tab).map((n) => this.points.get(n.id)!);
      if (!all.length) continue;
      this.tabBounds.set(tab, {
        minX: Math.min(...all.map((p) => p.x)),
        maxX: Math.max(...all.map((p) => p.x)),
        minY: Math.min(...all.map((p) => p.y)),
        maxY: Math.max(...all.map((p) => p.y)),
      });
    }
  }

  /** Границы вкладки «Профессия» (у дерева с ярусами — всего дерева). */
  get bounds(): TreeBounds {
    return this.boundsOf('profession');
  }

  boundsOf(tab: TalentTab): TreeBounds {
    return this.tabBounds.get(tab) ?? { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  /** Есть ли у дерева вкладка «Основа». */
  get hasBaseTab(): boolean {
    return this.tabBounds.has('base');
  }

  /** Координаты узла в мире дерева. */
  at(n: TreeNode): Point {
    return this.points.get(n.id)!;
  }

  // ------------------------------------------------------------------ блоки талантов

  /**
   * Блок талантов яруса под способностью: цепочки путей петляют вокруг осей путей и начинаются на
   * разной высоте. Цепочки в ярусе короткие (1–3 таланта), поэтому рисунок петель и высоты путей
   * сдвигаются на номер яруса `tier` — соседние ярусы не повторяют друг друга. Возвращает нижний
   * край блока.
   */
  private tierBlock(nodes: readonly TreeNode[], x0: number, top: number, tier: number): number {
    const G = SkillTreeLayout.GAP;
    const phases = SkillTreeLayout.PATH_PHASES;
    let bottom = top;
    for (const n of nodes) {
      const path = n.path!;
      const slot = SkillTreeLayout.PATH_SLOT[path];
      const pattern = SkillTreeLayout.LOOP_PATTERN[path];
      const x =
        x0 + slot * G.pathDx + pattern[(n.step! + tier) % pattern.length] * SkillTreeLayout.LOOP;
      const y = top + (n.step! + phases[(slot + 1 + tier) % phases.length]) * G.step;
      this.points.set(n.id, { x, y });
      bottom = Math.max(bottom, y);
    }
    return bottom;
  }

  // ------------------------------------------------------------------ дерево с ярусами

  private tiered(tree: TieredTree): void {
    const G = SkillTreeLayout.GAP;
    const b1 = this.block(tree.base, 0, 0);
    const b2 = this.block(tree.second, 0, b1 + G.blockGap);
    const evoY = b2 + G.blockGap;
    this.points.set(tree.evoNode.id, { x: 0, y: evoY });
    tree.terminals.forEach((t, i) =>
      this.block(t, (i === 0 ? -1 : 1) * G.terminalDx, evoY + G.blockGap),
    );
  }

  /** Блок класса с высоты `y0`; возвращает нижний край блока. */
  private block(classId: ClassId, x0: number, y0: number): number {
    const G = SkillTreeLayout.GAP;
    this.points.set(`cls/${classId}`, { x: x0, y: y0 });
    let y = y0 + G.startPerk;
    this.points.set(`perk/${classId}/start`, { x: x0, y });
    for (const tier of [1, 2, 3] as const) {
      const nodes = this.tree.nodes.filter(
        (n) => n.kind === 'talent' && n.owner === classId && n.tier === tier,
      );
      y = this.tierBlock(nodes, x0, y + G.gate, tier);
      if (tier === 3) break;
      const gate = this.tree.byId.get(`perk/${classId}/${tier === 1 ? 'p2' : 'p3'}`);
      if (!gate) break;
      y += G.gate;
      this.points.set(gate.id, { x: x0, y });
    }
    const legend = this.tree.byId.get(`perk/${classId}/legend`);
    if (!legend) return y;
    this.points.set(legend.id, { x: x0, y: y + G.gate });
    return y + G.gate;
  }

  // ------------------------------------------------------------------ дерево с ветками

  /** «Профессия»: базовый класс, подклассы в ряд, переходный класс под ними. */
  private profession(tree: BranchedTree): void {
    const G = SkillTreeLayout.GAP;
    this.points.set(`cls/${tree.base}`, { x: 0, y: 0 });
    const n = tree.subclasses.length;
    let bottom = 0;
    tree.subclasses.forEach((c, i) => {
      const x = (i - (n - 1) / 2) * G.subclassDx;
      bottom = Math.max(bottom, this.branchBlock(c, x, G.blockGap));
    });
    let y = bottom;
    for (const c of tree.transitional) y = this.branchBlock(c, 0, y + G.blockGap);
  }

  /**
   * Блок класса с ветками: карточка, под ней ветки столбцами. Способности стоят на оси ветки, а
   * таланты после каждой из них — вразнобой по сторонам. Возвращает нижний край.
   */
  private branchBlock(classId: ClassId, x0: number, y0: number): number {
    const G = SkillTreeLayout.GAP;
    this.points.set(`cls/${classId}`, { x: x0, y: y0 });
    const own = this.tree.nodes.filter((n) => n.owner === classId && n.branch !== undefined);
    const branches = [...new Set(own.map((n) => n.branch!))];
    let bottom = y0;
    branches.forEach((b, i) => {
      const axis = x0 + (i - (branches.length - 1) / 2) * G.branchDx;
      // у соседних веток таланты уходят в разные стороны
      const side = i % 2 === 0 ? 1 : -1;
      let afterPerk = 0;
      for (const n of own.filter((o) => o.branch === b).sort((p, q) => p.step! - q.step!)) {
        const y = y0 + G.startPerk + n.step! * G.step;
        afterPerk = n.kind === 'perk' ? 0 : afterPerk + 1;
        const pattern = SkillTreeLayout.BRANCH_PATTERN;
        const dx =
          n.kind === 'perk'
            ? 0
            : side * pattern[(afterPerk - 1) % pattern.length] * SkillTreeLayout.BRANCH_LOOP;
        this.points.set(n.id, { x: axis + dx, y });
        bottom = Math.max(bottom, y);
      }
    });
    return bottom;
  }

  /** «Основа»: ярусы талантов по путям сверху вниз, каждый — неровным блоком. */
  private baseTab(): void {
    const G = SkillTreeLayout.GAP;
    const base = this.tree.nodes.filter((n) => n.tab === 'base');
    const tiers = [...new Set(base.map((n) => n.tier!))].sort((a, b) => a - b);
    let top = 0;
    for (const tier of tiers) {
      const bottom = this.tierBlock(
        base.filter((o) => o.tier === tier),
        0,
        top,
        tier,
      );
      top = bottom + G.gate;
    }
  }
}
