import {
  baseClassOf,
  type BranchDef,
  type BranchedClassDef,
  branchPlaceId,
  branchSlot,
  branchTier,
  CLASSES,
  classesOfLineage,
  type ClassId,
  isBranched,
  levelsOf,
  type LineageId,
  maxRank,
  PATH_ORDER,
  TALENT_PLACE_BY_ID,
  talentChain,
  type TalentTierNumber,
} from '../../../../catalog';
import type { BranchedTree } from '../../interfaces/Tree';
import type { TreeNode } from '../../interfaces/TreeNode';

/**
 * Строит дерево прокачки линейки с ветками (маг, охотник) из каталога. Вкладка «Основа» — ярусы
 * общих талантов: цепочки путей, каждый следующий ярус — под концами цепочек предыдущего.
 * Вкладка «Профессия» — базовый класс, под ним подклассы, у каждого — ветки перков и талантов
 * шаг за шагом; переходный класс висит под концами веток всех своих подклассов. Уровни (`row`)
 * у вкладок свои; экранные координаты считает раскладка вида.
 */
export class BranchedTreeBuilder {
  private readonly nodes: TreeNode[] = [];
  private readonly edges: Array<[string, string]> = [];
  /** Концы веток класса — из них ведёт метаморфоза в следующий. */
  private readonly gates = new Map<ClassId, string[]>();
  /** Нижний уровень блока класса. */
  private readonly bottom = new Map<ClassId, number>();

  private constructor(private readonly lineage: LineageId) {}

  static build(lineage: LineageId): BranchedTree {
    return new BranchedTreeBuilder(lineage).tree();
  }

  private tree(): BranchedTree {
    const base = baseClassOf(this.lineage);
    this.baseTab(base);
    const classes = classesOfLineage(this.lineage);
    for (const id of classes) this.classBlock(CLASSES[id] as BranchedClassDef);

    const byId = new Map(this.nodes.map((n) => [n.id, n]));
    const classNode = {} as Record<ClassId, TreeNode>;
    for (const n of this.nodes) if (n.kind === 'class') classNode[n.classId!] = n;
    return {
      id: this.lineage,
      shape: 'branched',
      base,
      subclasses: classes.filter((c) => CLASSES[c].stage === 1),
      transitional: classes.filter((c) => CLASSES[c].stage === 2),
      nodes: this.nodes,
      edges: this.edges,
      byId,
      classNode,
    };
  }

  /** «Основа»: ярусы цепочек путей; первый ярус открыт сразу. */
  private baseTab(base: ClassId): void {
    let gates: string[] = [];
    let top = 0;
    for (let tier = 1; talentChainsOf(base, tier).length; tier++) {
      const next: string[] = [];
      let maxLen = 1;
      for (const path of PATH_ORDER) {
        const chain = talentChain(base, tier, path, 'base');
        if (!chain.length) continue;
        let prev: string[] = gates;
        chain.forEach((t, step) => {
          const id = `tal/${t.id}`;
          this.push(
            {
              id,
              kind: 'talent',
              tab: 'base',
              row: top + step,
              owner: base,
              talentId: t.id,
              path,
              tier: tier as TalentTierNumber,
              step,
              ranks: maxRank(t.talent.effect),
              parents: [],
            },
            prev,
          );
          prev = [id];
        });
        next.push(...prev);
        maxLen = Math.max(maxLen, chain.length);
      }
      gates = next;
      top += maxLen;
    }
  }

  /** Блок класса «Профессии»: карточка класса и под ней его ветки. */
  private classBlock(def: BranchedClassDef): void {
    const parents = def.parents.flatMap((p) => this.gates.get(p) ?? []);
    const row0 = def.parents.length
      ? Math.max(...def.parents.map((p) => this.bottom.get(p) ?? 0)) + 1
      : 0;
    const clsId = `cls/${def.id}`;
    this.push(
      {
        id: clsId,
        kind: 'class',
        tab: 'profession',
        row: row0,
        owner: def.id,
        classId: def.id,
        parents: [],
      },
      parents,
    );
    let bottom = row0;
    const ends: string[] = [];
    for (const b of def.branches) {
      const end = this.branch(def.id, b, clsId, row0);
      ends.push(end.id);
      bottom = Math.max(bottom, end.row);
    }
    this.gates.set(def.id, ends.length ? ends : [clsId]);
    this.bottom.set(def.id, bottom);
  }

  /** Ветка шаг за шагом под карточкой класса; возвращает её последний узел. */
  private branch(classId: ClassId, b: BranchDef, clsId: string, row0: number): TreeNode {
    let prev = clsId;
    let last: TreeNode | undefined;
    for (const [step, s] of b.steps.entries()) {
      const row = row0 + step + 1;
      const common = {
        tab: 'profession' as const,
        row,
        owner: classId,
        branch: b.id,
        step,
        parents: [],
      };
      const node: TreeNode =
        'perk' in s
          ? {
              ...common,
              id: `perk/${classId}/${branchSlot(b.id, step)}`,
              kind: 'perk',
              slot: branchSlot(b.id, step),
              ranks: levelsOf(s.perk),
            }
          : {
              ...common,
              id: `tal/${branchPlaceId(classId, b.id, step)}`,
              kind: 'talent',
              talentId: branchPlaceId(classId, b.id, step),
              path: TALENT_PLACE_BY_ID[branchPlaceId(classId, b.id, step)].path,
              tier: branchTier(step),
              ranks: maxRank(s.talent.effect),
            };
      this.push(node, [prev]);
      prev = node.id;
      last = node;
    }
    return last ?? this.nodes.find((n) => n.id === clsId)!;
  }

  private push(node: TreeNode, parents: readonly string[]): void {
    node.parents = [...parents];
    this.nodes.push(node);
    for (const p of parents) this.edges.push([p, node.id]);
  }
}

/** Есть ли у «Основы» ярус `tier` хоть на одном пути. */
const talentChainsOf = (base: ClassId, tier: number): string[] =>
  PATH_ORDER.flatMap((path) => talentChain(base, tier, path, 'base').map((t) => t.id));

/** Дерево с ветками строится только для линеек, чей базовый класс — с ветками. */
export const isBranchedLineage = (lineage: LineageId): boolean =>
  isBranched(CLASSES[baseClassOf(lineage)]);
