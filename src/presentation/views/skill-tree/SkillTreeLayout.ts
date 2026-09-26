import type { ClassId, TalentPath, TalentTab } from '../../../domain/catalog';
import type { BranchedTree, TieredTree, Tree, TreeNode } from '../../../domain/progression';
import type { Point } from '../../animations/interfaces/Point';
import type { TreeBounds } from './interfaces/TreeBounds';

/**
 * Раскладка дерева навыков: координаты узлов в «мире» дерева (до масштаба вида). Правилам
 * прокачки координаты не нужны — у узла там только уровень; экранная геометрия живёт здесь.
 *
 * Дерево с ярусами: блок класса идёт сверху вниз — карточка класса, стартовая способность, три
 * яруса цепочек талантов по путям (урон слева, здоровье по центру, защита справа) с воротами-
 * способностями между ярусами, легенда; финальные классы — два блока по сторонам под воротами.
 * Дерево с ветками: «Профессия» — базовый класс, под ним подклассы в ряд, у каждого ветки
 * столбцами, ниже — переходный класс со своими ветками; «Основа» — ярусы цепочек путей.
 * У каждой вкладки свои границы: на экране видна одна.
 */
export class SkillTreeLayout {
  private static readonly GAP = {
    /** От карточки класса до стартовой способности. */
    startPerk: 160,
    /** От способности до первого таланта цепочки и от последнего таланта до следующей способности. */
    gate: 158,
    /** Шаг между талантами внутри цепочки (плитка 108 + зазор под значок ранга). */
    step: 142,
    /** Разнос путей и веток по горизонтали. */
    pathDx: 200,
    /** Зазор между блоками классов и вокруг ворот эволюции. */
    blockGap: 225,
    /** Сдвиг блоков финальных классов и подклассов от центра. */
    terminalDx: 620,
  };

  private static readonly PATH_SLOT: Record<TalentPath, number> = {
    attack: -1,
    vitality: 0,
    guard: 1,
  };

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
      const top = y + G.gate;
      let maxLen = 1;
      for (const n of this.tree.nodes) {
        if (n.kind !== 'talent' || n.owner !== classId || n.tier !== tier) continue;
        const x = x0 + SkillTreeLayout.PATH_SLOT[n.path!] * G.pathDx;
        this.points.set(n.id, { x, y: top + n.step! * G.step });
        maxLen = Math.max(maxLen, n.step! + 1);
      }
      y = top + (maxLen - 1) * G.step;
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
      const x = (i - (n - 1) / 2) * G.terminalDx;
      bottom = Math.max(bottom, this.branchBlock(c, x, G.blockGap));
    });
    let y = bottom;
    for (const c of tree.transitional) y = this.branchBlock(c, 0, y + G.blockGap);
  }

  /** Блок класса с ветками: карточка и под ней ветки столбцами; возвращает нижний край. */
  private branchBlock(classId: ClassId, x0: number, y0: number): number {
    const G = SkillTreeLayout.GAP;
    this.points.set(`cls/${classId}`, { x: x0, y: y0 });
    const own = this.tree.nodes.filter((n) => n.owner === classId && n.branch !== undefined);
    const branches = [...new Set(own.map((n) => n.branch!))];
    let bottom = y0;
    branches.forEach((b, i) => {
      const x = x0 + (i - (branches.length - 1) / 2) * G.pathDx;
      for (const n of own.filter((o) => o.branch === b)) {
        const y = y0 + G.startPerk + n.step! * G.step;
        this.points.set(n.id, { x, y });
        bottom = Math.max(bottom, y);
      }
    });
    return bottom;
  }

  /** «Основа»: ярусы цепочек путей сверху вниз. */
  private baseTab(): void {
    const G = SkillTreeLayout.GAP;
    const base = this.tree.nodes.filter((n) => n.tab === 'base');
    const tiers = [...new Set(base.map((n) => n.tier!))].sort((a, b) => a - b);
    let top = 0;
    for (const tier of tiers) {
      let maxLen = 1;
      for (const n of base.filter((o) => o.tier === tier)) {
        const x = SkillTreeLayout.PATH_SLOT[n.path!] * G.pathDx;
        this.points.set(n.id, { x, y: top + n.step! * G.step });
        maxLen = Math.max(maxLen, n.step! + 1);
      }
      top += (maxLen - 1) * G.step + G.gate;
    }
  }
}
