import {
  CLASSES,
  type ClassId,
  type LineageId,
  maxRank,
  PATH_ORDER,
  type PerkSlot,
  perksOfClass,
  secondOf,
  talentChain,
  terminalsOf,
} from '../../../catalog';
import type { Tree } from '../interfaces/Tree';
import type { TreeNode } from '../interfaces/TreeNode';

/**
 * Строит дерево прокачки линейки из каталога: узлы, связи и уровни. Блок класса — карточка
 * класса, стартовая способность, три яруса цепочек талантов по путям с воротами-способностями
 * между ярусами и легендарная способность у финальных классов. Уровень (`row`) растёт на единицу
 * с каждым шагом вниз; цепочки разной длины — ярус заканчивается по самой длинной, короткие
 * ветки просто кончаются выше. Экранные координаты считает раскладка вида, а не дерево.
 */
export class SkillTreeBuilder {
  private readonly nodes: TreeNode[] = [];
  private readonly edges: Array<[string, string]> = [];

  private constructor(private readonly lineage: LineageId) {}

  static build(lineage: LineageId): Tree {
    return new SkillTreeBuilder(lineage).tree();
  }

  private tree(): Tree {
    const lineage = this.lineage;
    const second = secondOf(lineage);
    const terminals = terminalsOf(lineage);
    const b1 = this.classBlock(lineage, 0, []);
    const b2 = this.classBlock(second, b1.bottom + 1, b1.gates);

    const evoId = `evo/${lineage}`;
    const evoRow = b2.bottom + 1;
    this.nodes.push({ id: evoId, kind: 'evo', row: evoRow, owner: second, parents: b2.gates });
    for (const p of b2.gates) this.edges.push([p, evoId]);
    for (const t of terminals) this.classBlock(t, evoRow + 1, [evoId]);

    const byId = new Map(this.nodes.map((n) => [n.id, n]));
    const classNode = {} as Record<ClassId, TreeNode>;
    for (const n of this.nodes) if (n.kind === 'class') classNode[n.classId!] = n;
    return {
      id: lineage,
      base: lineage,
      second,
      terminals,
      nodes: this.nodes,
      edges: this.edges,
      byId,
      classNode,
      evoNode: byId.get(evoId)!,
    };
  }

  /** Блок класса с уровня `row0`; возвращает нижний уровень и концы цепочек последнего яруса. */
  private classBlock(
    classId: ClassId,
    row0: number,
    parents: string[],
  ): { gates: string[]; bottom: number } {
    const classNodeId = `cls/${classId}`;
    this.nodes.push({
      id: classNodeId,
      kind: 'class',
      row: row0,
      owner: classId,
      classId,
      parents,
    });
    for (const p of parents) this.edges.push([p, classNodeId]);

    const perks = perksOfClass(classId);
    const perkNodeId = (slot: PerkSlot): string => `perk/${classId}/${slot}`;
    // стартовая способность бесплатна и открывается вместе с классом
    let row = row0 + 1;
    this.addPerk(perkNodeId('start'), classId, 'start', row, [classNodeId]);

    let above = perkNodeId('start');
    let gates: string[] = [];
    for (let tier = 1 as 1 | 2 | 3; tier <= 3; tier = (tier + 1) as 1 | 2 | 3) {
      const tierTop = row + 1;
      const chains = this.tierChains(classId, tier, tierTop, above);
      gates = chains.gates;
      row = tierTop + chains.maxLen - 1;
      if (tier === 3) break;
      const slot: PerkSlot = tier === 1 ? 'p2' : 'p3';
      if (!perks.some((p) => p.slot === slot)) break;
      row += 1;
      above = perkNodeId(slot);
      this.addPerk(above, classId, slot, row, gates);
    }
    if (CLASSES[classId].stage === 2 && perks.some((p) => p.slot === 'legend')) {
      row += 1;
      this.addPerk(perkNodeId('legend'), classId, 'legend', row, gates);
    }
    return { gates, bottom: row };
  }

  /** Цепочки талантов яруса по путям; каждая начинается под способностью `above`. */
  private tierChains(
    classId: ClassId,
    tier: 1 | 2 | 3,
    top: number,
    above: string,
  ): { gates: string[]; maxLen: number } {
    let maxLen = 1;
    const gates: string[] = [];
    for (const path of PATH_ORDER) {
      const chain = talentChain(classId, tier, path);
      maxLen = Math.max(maxLen, chain.length);
      let prev = above;
      chain.forEach((t, step) => {
        const id = `tal/${t.id}`;
        this.nodes.push({
          id,
          kind: 'talent',
          row: top + step,
          owner: classId,
          talentId: t.id,
          path,
          tier,
          step,
          ranks: maxRank(t),
          parents: [prev],
        });
        this.edges.push([prev, id]);
        prev = id;
      });
      if (chain.length) gates.push(prev);
    }
    return { gates, maxLen };
  }

  private addPerk(
    id: string,
    owner: ClassId,
    slot: PerkSlot,
    row: number,
    parents: string[],
  ): void {
    this.nodes.push({ id, kind: 'perk', row, owner, slot, parents });
    for (const p of parents) this.edges.push([p, id]);
  }
}
