import type { ClassId, TalentPath } from '../../../domain/catalog';
import type { Tree, TreeNode } from '../../../domain/progression';
import type { Point } from '../../animations/interfaces/Point';
import type { TreeBounds } from './interfaces/TreeBounds';

/**
 * Раскладка дерева навыков: координаты узлов в «мире» дерева (до масштаба вида). Правилам
 * прокачки координаты не нужны — у узла там только уровень; экранная геометрия живёт здесь.
 *
 * Блок класса идёт сверху вниз: карточка класса, стартовая способность, три яруса цепочек
 * талантов по путям (урон слева, здоровье по центру, защита справа) с воротами-способностями
 * между ярусами, легенда. Высота яруса — по самой длинной цепочке. Финальные классы — два
 * блока по сторонам под воротами метаморфозы.
 */
export class SkillTreeLayout {
  private static readonly GAP = {
    /** От карточки класса до стартовой способности. */
    startPerk: 160,
    /** От способности до первого таланта цепочки и от последнего таланта до следующей способности. */
    gate: 158,
    /** Шаг между талантами внутри цепочки (плитка 108 + зазор под значок ранга). */
    step: 142,
    /** Разнос путей по горизонтали. */
    pathDx: 200,
    /** Зазор между блоками классов и вокруг ворот эволюции. */
    blockGap: 225,
    /** Сдвиг блоков финальных классов от центра. */
    terminalDx: 620,
  };

  private static readonly PATH_SLOT: Record<TalentPath, number> = {
    attack: -1,
    vitality: 0,
    guard: 1,
  };

  private readonly points = new Map<string, Point>();
  readonly bounds: TreeBounds;

  constructor(private readonly tree: Tree) {
    const G = SkillTreeLayout.GAP;
    const b1 = this.block(tree.base, 0, 0);
    const b2 = this.block(tree.second, 0, b1 + G.blockGap);
    const evoY = b2 + G.blockGap;
    this.points.set(tree.evoNode.id, { x: 0, y: evoY });
    tree.terminals.forEach((t, i) =>
      this.block(t, (i === 0 ? -1 : 1) * G.terminalDx, evoY + G.blockGap),
    );
    const all = [...this.points.values()];
    this.bounds = {
      minX: Math.min(...all.map((p) => p.x)),
      maxX: Math.max(...all.map((p) => p.x)),
      minY: Math.min(...all.map((p) => p.y)),
      maxY: Math.max(...all.map((p) => p.y)),
    };
  }

  /** Координаты узла в мире дерева. */
  at(n: TreeNode): Point {
    return this.points.get(n.id)!;
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
}
