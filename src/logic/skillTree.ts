import type { ClassId, LineageId, LineageSave, TalentPath } from '../types';
import { CLASSES, LINEAGE_ORDER, classesOfLineage, secondOf, terminalsOf } from '../data/classes';
import { classCost, perkCost, talentRankCost, talentTotalCost } from '../data/economy';
import { PERK_BY_ID, perkId, perksOfClass, type PerkSlot } from '../data/perks';
import { maxRank, TALENT_BY_ID, talentValue, talentsOfClass, talentsOfTier, type TalentDef, type TalentFx } from '../data/talents';
import { GAMEPLAY } from '../config';

export type NodeKind = 'class' | 'perk' | 'talent' | 'evo';

export interface TreeNode {
  id: string;
  kind: NodeKind;
  x: number;
  y: number;
  /** Класс, которому принадлежит узел (у узла-класса — он сам). */
  owner: ClassId;
  parents: string[];
  // talent
  talentId?: string;
  path?: TalentPath;
  tier?: 1 | 2 | 3;
  ranks?: number;
  // perk
  slot?: PerkSlot;
  // class
  classId?: ClassId;
}

export interface Tree {
  id: LineageId;
  base: ClassId;
  second: ClassId;
  terminals: ClassId[];
  nodes: TreeNode[];
  edges: Array<[string, string]>;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  byId: Map<string, TreeNode>;
  classNode: Record<ClassId, TreeNode>;
  evoNode: TreeNode;
}

// ------------------------------------------------------------------ построение дерева

/** Геометрия блока класса: от карточки класса вниз до последнего яруса талантов. */
const LAYOUT = {
  startPerk: 150,
  tier: [340, 720, 1100],
  perk: [530, 910],
  legend: 1290,
  talentDx: 195,
  blockGap: 230,
  evoGap: 230,
  terminalDx: 570,
};

const PATH_SLOT: Record<TalentPath, number> = { attack: -1, vitality: 0, guard: 1 };

const classBlock = (classId: ClassId, x0: number, y0: number, parents: string[], out: TreeNode[], edges: Array<[string, string]>): { tier3: string[]; bottom: number } => {
  const cls = CLASSES[classId];
  const classNodeId = `cls/${classId}`;
  out.push({ id: classNodeId, kind: 'class', x: x0, y: y0, owner: classId, classId, parents });
  for (const p of parents) edges.push([p, classNodeId]);

  const perks = perksOfClass(classId);
  const perkNodeId = (slot: PerkSlot): string => `perk/${classId}/${slot}`;

  // стартовый перк — бесплатный, открывается вместе с классом
  out.push({
    id: perkNodeId('start'), kind: 'perk', x: x0, y: y0 + LAYOUT.startPerk, owner: classId, slot: 'start', parents: [classNodeId],
  });
  edges.push([classNodeId, perkNodeId('start')]);

  let above = perkNodeId('start');
  let lastTier: string[] = [];
  for (let tier = 1 as 1 | 2 | 3; tier <= 3; tier = (tier + 1) as 1 | 2 | 3) {
    const list = talentsOfTier(classId, tier);
    const ids: string[] = [];
    for (const t of list) {
      const id = `tal/${t.id}`;
      out.push({
        id, kind: 'talent', x: x0 + PATH_SLOT[t.path] * LAYOUT.talentDx, y: y0 + LAYOUT.tier[tier - 1],
        owner: classId, talentId: t.id, path: t.path, tier, ranks: maxRank(t), parents: [above],
      });
      edges.push([above, id]);
      ids.push(id);
    }
    lastTier = ids;
    if (tier < 3) {
      const slot: PerkSlot = tier === 1 ? 'p2' : 'p3';
      if (!perks.some((p) => p.slot === slot)) break;
      const pid = perkNodeId(slot);
      out.push({ id: pid, kind: 'perk', x: x0, y: y0 + LAYOUT.perk[tier - 1], owner: classId, slot, parents: ids });
      for (const i of ids) edges.push([i, pid]);
      above = pid;
    }
  }

  let bottom = y0 + LAYOUT.tier[2];
  if (cls.stage === 2 && perks.some((p) => p.slot === 'legend')) {
    const lid = perkNodeId('legend');
    out.push({ id: lid, kind: 'perk', x: x0, y: y0 + LAYOUT.legend, owner: classId, slot: 'legend', parents: lastTier });
    for (const i of lastTier) edges.push([i, lid]);
    bottom = y0 + LAYOUT.legend;
  }
  return { tier3: lastTier, bottom };
};

const buildTree = (lineage: LineageId): Tree => {
  const nodes: TreeNode[] = [];
  const edges: Array<[string, string]> = [];
  const base = lineage;
  const second = secondOf(lineage);
  const terminals = terminalsOf(lineage);

  const b1 = classBlock(base, 0, 0, [], nodes, edges);
  const y2 = b1.bottom + LAYOUT.blockGap;
  const b2 = classBlock(second, 0, y2, b1.tier3, nodes, edges);

  const evoId = `evo/${lineage}`;
  const evoY = b2.bottom + LAYOUT.evoGap;
  nodes.push({ id: evoId, kind: 'evo', x: 0, y: evoY, owner: second, parents: b2.tier3 });
  for (const p of b2.tier3) edges.push([p, evoId]);

  const yT = evoY + LAYOUT.evoGap;
  terminals.forEach((t, i) => {
    classBlock(t, (i === 0 ? -1 : 1) * LAYOUT.terminalDx, yT, [evoId], nodes, edges);
  });

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const classNode = {} as Record<ClassId, TreeNode>;
  for (const n of nodes) if (n.kind === 'class') classNode[n.classId!] = n;
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  return {
    id: lineage, base, second, terminals, nodes, edges,
    bounds: { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) },
    byId, classNode, evoNode: byId.get(evoId)!,
  };
};

export const TREES = Object.fromEntries(LINEAGE_ORDER.map((l) => [l, buildTree(l)])) as Record<LineageId, Tree>;

// ------------------------------------------------------------------ состояние узлов

export const talentOfNode = (n: TreeNode): TalentDef => TALENT_BY_ID[n.talentId!];

export const perkIdOfNode = (n: TreeNode): string => perkId(n.owner, n.slot!);

/** Стартовая способность бесплатна и не хранится в сохранении: она выводится из «класс открыт». */
export const newLineageSave = (tree: Tree): LineageSave => ({
  ranks: { [tree.classNode[tree.base].id]: 1 },
  last: tree.classNode[tree.base].id,
});

export const rankOf = (s: LineageSave, id: string): number => s.ranks[id] ?? 0;

export const maxRankOf = (n: TreeNode): number => n.ranks ?? 1;

export const isMaxed = (s: LineageSave, n: TreeNode): boolean => rankOf(s, n.id) >= maxRankOf(n);

export const isClassOwned = (tree: Tree, s: LineageSave, classId: ClassId): boolean =>
  rankOf(s, tree.classNode[classId].id) > 0;

/** Классы линейки, которые игрок уже открыл. */
export const openedClasses = (tree: Tree, s: LineageSave): ClassId[] =>
  classesOfLineage(tree.id).filter((c) => isClassOwned(tree, s, c)).sort((a, b) => CLASSES[a].stage - CLASSES[b].stage);

/**
 * Текущий класс линейки — самый развитый из открытых. Метаморфоза — это прокачка того же героя,
 * а не новый персонаж: в выборе класса он занимает место прежнего.
 */
export const currentClassOf = (tree: Tree, s: LineageSave): ClassId => {
  const list = openedClasses(tree, s);
  return list[list.length - 1] ?? tree.base;
};

const evolvedBeyond = (tree: Tree, s: LineageSave, owner: ClassId): boolean =>
  classesOfLineage(tree.id).some((c) => CLASSES[c].parent === owner && isClassOwned(tree, s, c));

/** Узел «выполнен» для открытия дочерних: талант прокачан до максимума, перк/класс куплен. */
const satisfied = (tree: Tree, s: LineageSave, id: string): boolean => {
  const n = tree.byId.get(id);
  if (!n) return false;
  if (n.kind === 'talent') return isMaxed(s, n);
  if (n.kind === 'perk' && n.slot === 'start') return isClassOwned(tree, s, n.owner);
  if (n.kind === 'perk') return rankOf(s, n.id) > 0 || evolvedBeyond(tree, s, n.owner);
  if (n.kind === 'evo') return n.parents.some((p) => satisfied(tree, s, p));
  return rankOf(s, n.id) > 0;
};

export type NodeState = 'owned' | 'partial' | 'available' | 'locked' | 'blocked';

export const nodeState = (tree: Tree, s: LineageSave, n: TreeNode): NodeState => {
  if (n.kind === 'evo') return satisfied(tree, s, n.id) ? 'owned' : 'locked';
  if (n.kind === 'perk' && n.slot === 'start') return isClassOwned(tree, s, n.owner) ? 'owned' : 'locked';
  const rank = rankOf(s, n.id);
  const gateOpen = n.parents.length === 0 || n.parents.some((p) => satisfied(tree, s, p));

  if (n.kind === 'talent') {
    if (rank >= maxRankOf(n)) return 'owned';
    if (rank > 0) return 'partial';
    return gateOpen ? 'available' : 'locked';
  }
  if (rank > 0) return 'owned';
  // перки прежнего класса потеряны при метаморфозе и заново не покупаются
  if (n.kind === 'perk' && evolvedBeyond(tree, s, n.owner)) return 'blocked';
  if (n.kind === 'class') {
    const cls = CLASSES[n.classId!];
    if (cls.stage === 2) {
      const sibling = tree.terminals.find((c) => c !== n.classId);
      if (sibling && isClassOwned(tree, s, sibling)) return 'blocked';
    }
  }
  return gateOpen ? 'available' : 'locked';
};

/** Можно ли ещё вкладывать души в этот узел. */
export const canInvest = (tree: Tree, s: LineageSave, n: TreeNode): boolean => {
  const st = nodeState(tree, s, n);
  return st === 'available' || st === 'partial';
};

export const isPurchasable = (n: TreeNode): boolean => n.kind !== 'evo' && !(n.kind === 'perk' && n.slot === 'start');

/** Цена следующего шага: у таланта — очередной ранг, у перка и класса — вся покупка. */
export const costOf = (s: LineageSave, n: TreeNode): number => {
  if (n.kind === 'talent') {
    const next = rankOf(s, n.id) + 1;
    if (next > maxRankOf(n)) return 0;
    return talentRankCost(n.owner, n.tier!, next);
  }
  if (n.kind === 'perk') return perkCost(n.owner, n.slot!);
  if (n.kind === 'class') return classCost(n.classId!);
  return 0;
};

export type BuyResult = { ok: true; cost: number } | { ok: false; reason: 'state' | 'souls' };

export const canBuy = (tree: Tree, s: LineageSave, n: TreeNode, souls: number): BuyResult => {
  if (!isPurchasable(n) || !canInvest(tree, s, n)) return { ok: false, reason: 'state' };
  const cost = costOf(s, n);
  return souls >= cost ? { ok: true, cost } : { ok: false, reason: 'souls' };
};

/** Покупает ранг узла (души списывает вызывающий). Возвращает перки, потерянные при метаморфозе. */
export const applyBuy = (tree: Tree, s: LineageSave, n: TreeNode): { lostPerks: string[] } => {
  const lost: string[] = [];
  if (n.kind === 'class') {
    const old = CLASSES[n.classId!].parent;
    if (old) {
      for (const node of tree.nodes) {
        if (node.kind === 'perk' && node.slot !== 'start' && node.owner === old && rankOf(s, node.id) > 0) {
          lost.push(perkIdOfNode(node));
          delete s.ranks[node.id];
        }
      }
    }
  }
  s.ranks[n.id] = rankOf(s, n.id) + 1;
  s.last = n.id;
  return { lostPerks: lost };
};

export const canCancelMetamorphosis = (tree: Tree, s: LineageSave, classId: ClassId): boolean =>
  CLASSES[classId].stage === 2 && isClassOwned(tree, s, classId) && tree.terminals.includes(classId);

/** Сбрасывает ветку финального класса. Возвращает часть потраченного опыта душ. */
export const applyCancelMetamorphosis = (tree: Tree, s: LineageSave, classId: ClassId): { refund: number } => {
  let spent = classCost(classId);
  for (const n of tree.nodes) {
    if (n.owner !== classId) continue;
    const rank = rankOf(s, n.id);
    if (rank <= 0) continue;
    if (n.kind === 'talent') spent += talentTotalCost(n.owner, n.tier!, rank);
    else if (n.kind === 'perk' && n.slot !== 'start') spent += perkCost(n.owner, n.slot!);
    delete s.ranks[n.id];
  }
  delete s.ranks[tree.classNode[classId].id];
  s.last = tree.classNode[CLASSES[classId].parent!].id;
  return { refund: Math.floor(spent * GAMEPLAY.cancelMetamorphosisRefund) };
};

// ------------------------------------------------------------------ бонусы и перки

export type TalentBonus = Partial<Record<TalentFx, number>>;

/**
 * Сумма эффектов всех изученных талантов линейки. Таланты сохраняются при метаморфозе —
 * это постоянный рост героя, в отличие от перков.
 */
export const talentBonuses = (tree: Tree, s: LineageSave): TalentBonus => {
  const out: TalentBonus = {};
  for (const n of tree.nodes) {
    if (n.kind !== 'talent') continue;
    const rank = rankOf(s, n.id);
    if (rank <= 0) continue;
    const def = talentOfNode(n);
    out[def.fx] = (out[def.fx] ?? 0) + talentValue(def, rank);
  }
  return out;
};

/** Сколько рангов талантов изучено всего (для сводки в интерфейсе). */
export const talentPointsSpent = (tree: Tree, s: LineageSave): number =>
  tree.nodes.reduce((a, n) => a + (n.kind === 'talent' ? rankOf(s, n.id) : 0), 0);

/** Активные перки выбранного класса: стартовый (бесплатный) + купленные. */
export const activePerkIds = (tree: Tree, s: LineageSave, active: ClassId): string[] => {
  const ids: string[] = [];
  for (const n of tree.nodes) {
    if (n.kind !== 'perk' || n.owner !== active) continue;
    if (n.slot === 'start' ? isClassOwned(tree, s, active) : rankOf(s, n.id) > 0) ids.push(perkIdOfNode(n));
  }
  // базовое действие линейки (выстрел через карту, удар в спину, удар молнии) остаётся у всех эволюций
  const basic = perkId(tree.base, 'start');
  if (PERK_BY_ID[basic]?.basic && !ids.includes(basic)) ids.unshift(basic);
  return ids;
};

/** Есть ли что купить прямо сейчас (для красной точки на иконке героя). */
export const anyAffordable = (tree: Tree, s: LineageSave, souls: number): boolean =>
  tree.nodes.some((n) => isPurchasable(n) && canInvest(tree, s, n) && costOf(s, n) <= souls);

export const cheapestAvailable = (tree: Tree, s: LineageSave): number => {
  let best = Infinity;
  for (const n of tree.nodes) {
    if (isPurchasable(n) && canInvest(tree, s, n)) best = Math.min(best, costOf(s, n));
  }
  return best;
};

/** Таланты класса по путям — для панели дерева. */
export const classTalents = talentsOfClass;
