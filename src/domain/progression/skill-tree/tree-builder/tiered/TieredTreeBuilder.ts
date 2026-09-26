import {
  baseClassOf,
  CLASSES,
  type ClassId,
  LAST_TIER,
  type LineageId,
  maxRank,
  PATH_ORDER,
  perkOf,
  secondOf,
  talentChain,
  type TalentTierNumber,
  terminalsOf,
  type TieredPerkSlot,
} from '../../../../catalog';
import type { TieredTree } from '../../interfaces/Tree';
import type { TreeNode } from '../../interfaces/TreeNode';

/**
 * Строит дерево прокачки линейки с ярусами (воин, наёмник) из каталога: узлы, связи и уровни. Блок класса — карточка
 * класса, стартовая способность, три яруса цепочек талантов по путям с воротами-способностями
 * между ярусами и легендарная способность у финальных классов. Уровень (`row`) растёт на единицу
 * с каждым шагом вниз; цепочки разной длины — ярус заканчивается по самой длинной, короткие
 * ветки просто кончаются выше. Экранные координаты считает раскладка вида, а не дерево.
 */
export class TieredTreeBuilder {
  private readonly nodes: TreeNode[] = [];
  private readonly edges: Array<[string, string]> = [];

  private constructor(private readonly lineage: LineageId) {}

  static build(lineage: LineageId): TieredTree {
    return new TieredTreeBuilder(lineage).tree();
  }

  private tree(): TieredTree {
    const lineage = this.lineage;
    const second = secondOf(lineage);
    const terminals = terminalsOf(lineage);
    const b1 = this.classBlock(baseClassOf(lineage), 0, []);
    const b2 = this.classBlock(second, b1.bottom + 1, b1.gates);

    const evoId = `evo/${lineage}`;
    const evoRow = b2.bottom + 1;
    this.nodes.push({
      id: evoId,
      kind: 'evo',
      tab: 'profession',
      row: evoRow,
      owner: second,
      parents: b2.gates,
    });
    for (const p of b2.gates) this.edges.push([p, evoId]);
    for (const t of terminals) this.classBlock(t, evoRow + 1, [evoId]);

    const byId = new Map(this.nodes.map((n) => [n.id, n]));
    const classNode = {} as Record<ClassId, TreeNode>;
    for (const n of this.nodes) if (n.kind === 'class') classNode[n.classId!] = n;
    return {
      id: lineage,
      shape: 'tiered',
      base: baseClassOf(lineage),
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
      tab: 'profession',
      row: row0,
      owner: classId,
      classId,
      parents,
    });
    for (const p of parents) this.edges.push([p, classNodeId]);

    const perkNodeId = (slot: TieredPerkSlot): string => `perk/${classId}/${slot}`;
    // стартовая способность бесплатна и открывается вместе с классом
    let row = row0 + 1;
    this.addPerk(perkNodeId('start'), classId, 'start', row, [classNodeId]);

    let above = perkNodeId('start');
    let gates: string[] = [];
    for (let tier: TalentTierNumber = 1; tier <= LAST_TIER; tier = (tier + 1) as TalentTierNumber) {
      const tierTop = row + 1;
      const chains = this.tierChains(classId, tier, tierTop, above);
      gates = chains.gates;
      row = tierTop + chains.maxLen - 1;
      if (tier === LAST_TIER) break;
      const slot: TieredPerkSlot = tier === 1 ? 'p2' : 'p3';
      if (!perkOf(classId, slot)) break;
      row += 1;
      above = perkNodeId(slot);
      this.addPerk(above, classId, slot, row, gates);
    }
    if (CLASSES[classId].stage === 2 && perkOf(classId, 'legend')) {
      row += 1;
      this.addPerk(perkNodeId('legend'), classId, 'legend', row, gates);
    }
    return { gates, bottom: row };
  }

  /** Цепочки талантов яруса по путям; каждая начинается под способностью `above`. */
  private tierChains(
    classId: ClassId,
    tier: TalentTierNumber,
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
          tab: 'profession',
          row: top + step,
          owner: classId,
          talentId: t.id,
          path,
          tier,
          step,
          ranks: maxRank(t.talent.effect),
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
    slot: TieredPerkSlot,
    row: number,
    parents: string[],
  ): void {
    this.nodes.push({ id, kind: 'perk', tab: 'profession', row, owner, slot, parents });
    for (const p of parents) this.edges.push([p, id]);
  }
}
