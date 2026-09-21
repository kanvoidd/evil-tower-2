import raw from '../data/skillTree.json';
import type { ChainKind, ClassId, LineageId, LineageSave, StatKey, Stats } from '../types';
import { CLASSES } from '../data/classes';
import { classCost, NODE_VALUE, nodeCost, perkCost } from '../data/economy';
import { perkId, SLOT_BY_SEG } from '../data/perks';
import { GAMEPLAY } from '../config';

export type NodeKind = 'class' | 'perk' | 'evo' | 'stat';

export interface TreeNode {
  id: number;
  kind: NodeKind;
  x: number;
  y: number;
  parents: number[];
  stat?: Exclude<StatKey, 'luck'>;
  tier?: number;
  chain?: ChainKind;
  owner?: ClassId;
  seg?: number;
  alt?: boolean;
  excl?: number;
  classId?: ClassId;
}

export interface Tree {
  id: LineageId;
  base: ClassId;
  second: ClassId;
  terminals: ClassId[];
  nodes: TreeNode[];
  edges: Array<[number, number]>;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  byId: Map<number, TreeNode>;
  children: Map<number, number[]>;
  classNode: Partial<Record<ClassId, TreeNode>>;
  evoNode: TreeNode;
}

export const TREES = {} as Record<LineageId, Tree>;

for (const [lineage, t] of Object.entries(raw as Record<string, any>)) {
  const nodes: TreeNode[] = t.nodes;
  const byId = new Map<number, TreeNode>(nodes.map((n) => [n.id, n]));
  const children = new Map<number, number[]>();
  for (const [a, b] of t.edges as Array<[number, number]>) {
    if (!children.has(a)) children.set(a, []);
    children.get(a)!.push(b);
  }
  const classNode: Partial<Record<ClassId, TreeNode>> = {};
  for (const n of nodes) if (n.kind === 'class') classNode[n.classId!] = n;
  TREES[lineage as LineageId] = {
    id: lineage as LineageId,
    base: t.base,
    second: t.second,
    terminals: t.terminals,
    nodes,
    edges: t.edges,
    bounds: t.bounds,
    byId,
    children,
    classNode,
    evoNode: nodes.find((n) => n.kind === 'evo')!,
  };
}

export const perkIdOfNode = (n: TreeNode): string => perkId(n.owner!, SLOT_BY_SEG[n.seg!]);

export const newLineageSave = (tree: Tree): LineageSave => ({ owned: [tree.classNode[tree.base]!.id], last: tree.classNode[tree.base]!.id });

const ownedSet = (s: LineageSave): Set<number> => new Set(s.owned);

export const isClassOwned = (tree: Tree, s: LineageSave, classId: ClassId): boolean => {
  const n = tree.classNode[classId];
  return !!n && s.owned.includes(n.id);
};

/** Классы линейки, которые игрок уже открыл (и может выбрать активным). */
export const openedClasses = (tree: Tree, s: LineageSave): ClassId[] =>
  (Object.keys(tree.classNode) as ClassId[])
    .filter((c) => isClassOwned(tree, s, c))
    .sort((a, b) => CLASSES[a].stage - CLASSES[b].stage);

/**
 * Текущий класс линейки — самый развитый из открытых. Метаморфоза — это прокачка того же героя, а не новый персонаж:
 * в выборе класса он занимает место прежнего, и вернуться к прежнему классу нельзя.
 */
export const currentClassOf = (tree: Tree, s: LineageSave): ClassId => {
  const list = openedClasses(tree, s);
  return list[list.length - 1] ?? tree.base;
};

const evolvedBeyond = (tree: Tree, s: LineageSave, owner: ClassId): boolean =>
  (Object.keys(tree.classNode) as ClassId[]).some((c) => CLASSES[c].parent === owner && isClassOwned(tree, s, c));

/** Узел «выполнен» для открытия дочерних: куплен (перк — ещё и не потерян при метаморфозе). */
const satisfied = (tree: Tree, s: LineageSave, set: Set<number>, id: number): boolean => {
  const n = tree.byId.get(id)!;
  if (n.kind === 'evo') return n.parents.some((p) => set.has(p));
  if (n.kind === 'perk') {
    if (n.seg === 0) return isClassOwned(tree, s, n.owner!);
    return set.has(n.id) || evolvedBeyond(tree, s, n.owner!);
  }
  return set.has(id);
};

export type NodeState = 'owned' | 'available' | 'locked' | 'blocked';

export const nodeState = (tree: Tree, s: LineageSave, n: TreeNode): NodeState => {
  const set = ownedSet(s);
  if (n.kind === 'evo') return satisfied(tree, s, set, n.id) ? 'owned' : 'locked';
  if (n.kind === 'perk' && n.seg === 0) return isClassOwned(tree, s, n.owner!) ? 'owned' : 'locked';
  if (set.has(n.id)) return 'owned';
  // Перки прежнего класса потеряны при метаморфозе и заново не покупаются.
  if (n.kind === 'perk' && n.seg! > 0 && evolvedBeyond(tree, s, n.owner!)) return 'blocked';
  if (n.excl !== undefined && set.has(n.excl)) return 'blocked';
  if (n.kind === 'class') {
    const cls = CLASSES[n.classId!];
    if (cls.stage === 2) {
      const sibling = tree.terminals.find((c) => c !== n.classId);
      if (sibling && isClassOwned(tree, s, sibling)) return 'blocked';
    }
  }
  if (n.parents.length === 0) return 'locked';
  return n.parents.some((p) => satisfied(tree, s, set, p)) ? 'available' : 'locked';
};

export const costOf = (n: TreeNode): number => {
  if (n.kind === 'stat') return nodeCost(n.owner!, n.seg!, n.tier!);
  if (n.kind === 'perk') return perkCost(n.owner!, n.seg!);
  if (n.kind === 'class') return classCost(n.classId!);
  return 0;
};

export const isPurchasable = (n: TreeNode): boolean => n.kind !== 'evo' && !(n.kind === 'perk' && n.seg === 0);

export type BuyResult = { ok: true; cost: number } | { ok: false; reason: 'state' | 'souls' };

export const canBuy = (tree: Tree, s: LineageSave, n: TreeNode, souls: number): BuyResult => {
  if (!isPurchasable(n) || nodeState(tree, s, n) !== 'available') return { ok: false, reason: 'state' };
  const cost = costOf(n);
  return souls >= cost ? { ok: true, cost } : { ok: false, reason: 'souls' };
};

/** Покупает узел (деньги списывает вызывающий). Возвращает потерянные перки при метаморфозе. */
export const applyBuy = (tree: Tree, s: LineageSave, n: TreeNode): { lostPerks: string[] } => {
  const lost: string[] = [];
  if (n.kind === 'class') {
    const cls = CLASSES[n.classId!];
    const old = cls.parent;
    if (old) {
      s.owned = s.owned.filter((id) => {
        const on = tree.byId.get(id)!;
        const drop = on.kind === 'perk' && on.owner === old;
        if (drop) lost.push(perkIdOfNode(on));
        return !drop;
      });
    }
  }
  s.owned.push(n.id);
  s.last = n.id;
  return { lostPerks: lost };
};

/** Все узлы, принадлежащие ветке класса (для отмены метаморфозы). */
export const nodesOfClass = (tree: Tree, classId: ClassId): TreeNode[] =>
  tree.nodes.filter((n) => (n.kind === 'stat' || n.kind === 'perk') && n.owner === classId);

export const canCancelMetamorphosis = (tree: Tree, s: LineageSave, classId: ClassId): boolean =>
  CLASSES[classId].stage === 2 && isClassOwned(tree, s, classId) && tree.terminals.includes(classId);

/** Сбрасывает ветку класса. Возвращает возврат опыта душ (доля от потраченного). */
export const applyCancelMetamorphosis = (tree: Tree, s: LineageSave, classId: ClassId): { refund: number } => {
  const drop = new Set<number>([tree.classNode[classId]!.id, ...nodesOfClass(tree, classId).map((n) => n.id)]);
  let spent = 0;
  for (const id of s.owned) {
    if (!drop.has(id)) continue;
    const n = tree.byId.get(id)!;
    if (n.kind === 'perk' && n.seg === 0) continue;
    spent += costOf(n);
  }
  s.owned = s.owned.filter((id) => !drop.has(id));
  const parent = CLASSES[classId].parent!;
  const parentNode = tree.classNode[parent]!;
  s.last = parentNode.id;
  return { refund: Math.floor(spent * GAMEPLAY.cancelMetamorphosisRefund) };
};

/** Сумма бонусов от всех купленных узлов линейки. */
export const treeBonuses = (tree: Tree, s: LineageSave): Stats => {
  const out: Stats = { damage: 0, crit: 0, health: 0, dodge: 0, defense: 0, parry: 0, luck: 0 };
  for (const id of s.owned) {
    const n = tree.byId.get(id);
    if (n && n.kind === 'stat') out[n.stat!] += NODE_VALUE[n.stat!];
  }
  return out;
};

/** Активные перки для выбранного класса: стартовый (бесплатный) + купленные, принадлежащие классу. */
export const activePerkIds = (tree: Tree, s: LineageSave, active: ClassId): string[] => {
  const ids: string[] = [perkId(active, 'start')];
  for (const id of s.owned) {
    const n = tree.byId.get(id);
    if (n && n.kind === 'perk' && n.owner === active && n.seg! > 0) ids.push(perkIdOfNode(n));
  }
  return ids;
};

/** Есть ли что купить прямо сейчас (для красной точки на иконке героя). */
export const anyAffordable = (tree: Tree, s: LineageSave, souls: number): boolean => {
  for (const n of tree.nodes) {
    if (!isPurchasable(n)) continue;
    if (nodeState(tree, s, n) === 'available' && costOf(n) <= souls) return true;
  }
  return false;
};

export const cheapestAvailable = (tree: Tree, s: LineageSave): number => {
  let best = Infinity;
  for (const n of tree.nodes) {
    if (!isPurchasable(n)) continue;
    if (nodeState(tree, s, n) === 'available') best = Math.min(best, costOf(n));
  }
  return best;
};
