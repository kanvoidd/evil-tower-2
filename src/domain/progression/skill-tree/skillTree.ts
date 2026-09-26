/**
 * Правила дерева прокачки над купленным (`LineageSave`): состояние узлов, цены, покупка,
 * отказ от класса, изученные таланты и доступные способности. Что таланты дают, дерево не
 * знает — это считают характеристики героя (`stats/talent-bonuses`).
 */
import {
  childrenOf,
  CLASSES,
  classesOfLineage,
  type ClassId,
  isBranched,
  PERK_BY_ID,
  type PerkDef,
  perkId,
  perksOfClass,
  placesOfClass,
  siblingsOf,
  TALENT_PLACE_BY_ID,
  type TalentPlace,
} from '../../catalog';
import { Souls } from '../../shared';
import { SOUL_PRICING } from '../soul-prices/soulPricing';
import type { BuyResult } from './interfaces/BuyResult';
import type { LearnedTalent } from './interfaces/LearnedTalent';
import type { LineageSave } from './interfaces/LineageSave';
import type { NodeState } from './interfaces/NodeState';
import type { Tree } from './interfaces/Tree';
import type { TreeNode } from './interfaces/TreeNode';

// ------------------------------------------------------------------ состояние узлов

export const talentOfNode = (n: TreeNode): TalentPlace => TALENT_PLACE_BY_ID[n.talentId!];

export const perkIdOfNode = (n: TreeNode): string => perkId(n.owner, n.slot!);

export const perkOfNode = (n: TreeNode): PerkDef => PERK_BY_ID[perkIdOfNode(n)];

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

/** Стартовый перк класса с ярусами: бесплатен и открывается вместе с классом. */
const isStartPerk = (n: TreeNode): boolean => n.kind === 'perk' && n.slot === 'start';

/** Классы линейки, которые игрок уже открыл. */
export const openedClasses = (tree: Tree, s: LineageSave): ClassId[] =>
  classesOfLineage(tree.id)
    .filter((c) => isClassOwned(tree, s, c))
    .sort((a, b) => CLASSES[a].stage - CLASSES[b].stage);

/**
 * Текущий класс линейки — самый развитый из открытых. Метаморфоза — это прокачка того же героя,
 * а не новый персонаж: в выборе класса он занимает место прежнего.
 */
export const currentClassOf = (tree: Tree, s: LineageSave): ClassId => {
  const list = openedClasses(tree, s);
  return list[list.length - 1] ?? tree.base;
};

/**
 * Узел «выполнен» для открытия дочерних. У таланта это максимальный ранг: цепочка линейная,
 * поэтому максимум у последнего таланта означает, что вся цепочка пройдена. У перка хватает
 * первого уровня — следующие уровни не держат ветку.
 */
const satisfied = (tree: Tree, s: LineageSave, id: string): boolean => {
  const n = tree.byId.get(id);
  if (!n) return false;
  if (n.kind === 'talent') return isMaxed(s, n);
  if (isStartPerk(n)) return isClassOwned(tree, s, n.owner);
  if (n.kind === 'evo') return n.parents.some((p) => satisfied(tree, s, p));
  return rankOf(s, n.id) > 0;
};

/** Узла с рангами (талант, перк с уровнями): изучен до конца, частично, доступен или закрыт. */
const rankedState = (s: LineageSave, n: TreeNode, gateOpen: boolean): NodeState => {
  const rank = rankOf(s, n.id);
  if (rank >= maxRankOf(n)) return 'owned';
  if (rank > 0) return 'partial';
  return gateOpen ? 'available' : 'locked';
};

/** Класс закрыт, если герой уже выбрал соседний класс той же метаморфозы (финал, подкласс). */
const siblingTaken = (tree: Tree, s: LineageSave, n: TreeNode): boolean =>
  siblingsOf(n.classId!).some((c) => isClassOwned(tree, s, c));

/**
 * Ветка закрыта, если класс позволяет развивать только одну (стихия элементалиста), а в другой
 * его ветке уже что-то изучено.
 */
const branchTaken = (tree: Tree, s: LineageSave, n: TreeNode): boolean => {
  const cls = CLASSES[n.owner];
  if (!n.branch || !isBranched(cls) || cls.branchChoice !== 'one') return false;
  return tree.nodes.some(
    (o) => o.owner === n.owner && o.branch && o.branch !== n.branch && rankOf(s, o.id) > 0,
  );
};

export const nodeState = (tree: Tree, s: LineageSave, n: TreeNode): NodeState => {
  if (n.kind === 'evo') return satisfied(tree, s, n.id) ? 'owned' : 'locked';
  if (isStartPerk(n)) return isClassOwned(tree, s, n.owner) ? 'owned' : 'locked';
  const gateOpen = n.parents.length === 0 || n.parents.some((p) => satisfied(tree, s, p));
  if (rankOf(s, n.id) === 0 && branchTaken(tree, s, n)) return 'blocked';
  if (n.kind === 'talent' || maxRankOf(n) > 1) return rankedState(s, n, gateOpen);
  if (rankOf(s, n.id) > 0) return 'owned';
  if (n.kind === 'class' && siblingTaken(tree, s, n)) return 'blocked';
  return gateOpen ? 'available' : 'locked';
};

/** Можно ли ещё вкладывать души в этот узел. */
export const canInvest = (tree: Tree, s: LineageSave, n: TreeNode): boolean => {
  const st = nodeState(tree, s, n);
  return st === 'available' || st === 'partial';
};

export const isPurchasable = (n: TreeNode): boolean => n.kind !== 'evo' && !isStartPerk(n);

/** Цена следующего шага: у таланта — очередной ранг, у перка — очередной уровень, у класса — метаморфоза. */
export const costOf = (s: LineageSave, n: TreeNode): Souls => {
  const next = rankOf(s, n.id) + 1;
  if (n.kind === 'talent') {
    if (next > maxRankOf(n)) return Souls.of(0);
    return SOUL_PRICING.talentRank(talentOfNode(n), next);
  }
  if (n.kind === 'perk') {
    if (next > maxRankOf(n)) return Souls.of(0);
    return SOUL_PRICING.perk(perkOfNode(n), next);
  }
  if (n.kind === 'class') return SOUL_PRICING.metamorphosis(n.classId!);
  return Souls.of(0);
};

export const canBuy = (tree: Tree, s: LineageSave, n: TreeNode, souls: Souls): BuyResult => {
  if (!isPurchasable(n) || !canInvest(tree, s, n)) return { ok: false, reason: 'state' };
  const cost = costOf(s, n);
  return souls >= cost ? { ok: true, cost } : { ok: false, reason: 'souls' };
};

/**
 * Покупает ранг узла (души списывает вызывающий).
 * Метаморфоза больше ничего не отнимает: способности прежних классов остаются с героем.
 */
export const applyBuy = (_tree: Tree, s: LineageSave, n: TreeNode): void => {
  s.ranks[n.id] = rankOf(s, n.id) + 1;
  s.last = n.id;
};

/**
 * Отказаться можно от класса, выбранного из нескольких (финал воина, подкласс мага), пока герой
 * не ушёл из него дальше.
 */
export const canCancelMetamorphosis = (tree: Tree, s: LineageSave, classId: ClassId): boolean =>
  isClassOwned(tree, s, classId) &&
  siblingsOf(classId).length > 0 &&
  !childrenOf(classId).some((c) => isClassOwned(tree, s, c));

/** Сколько вложено в узел класса (без самой метаморфозы). */
const spentOn = (s: LineageSave, n: TreeNode): number => {
  const rank = rankOf(s, n.id);
  if (rank <= 0) return 0;
  if (n.kind === 'talent') return SOUL_PRICING.talentTotal(talentOfNode(n), rank);
  if (n.kind === 'perk' && !isStartPerk(n)) return SOUL_PRICING.perkTotal(perkOfNode(n), rank);
  return 0;
};

/** Сбрасывает ветку класса. Возвращает часть потраченного опыта душ. */
export const applyCancelMetamorphosis = (
  tree: Tree,
  s: LineageSave,
  classId: ClassId,
): { refund: Souls } => {
  let spent: number = SOUL_PRICING.metamorphosis(classId);
  for (const n of tree.nodes) {
    if (n.owner !== classId || n.tab !== 'profession' || n.kind === 'class') continue;
    spent += spentOn(s, n);
    delete s.ranks[n.id];
  }
  delete s.ranks[tree.classNode[classId].id];
  const parent = CLASSES[classId].parents.find((p) => isClassOwned(tree, s, p))!;
  s.last = tree.classNode[parent].id;
  return { refund: SOUL_PRICING.refund(spent) };
};

// ------------------------------------------------------------------ изученное и способности

/** Изученные таланты линейки по порядку дерева — что они дают, считают характеристики героя. */
export const learnedTalents = (tree: Tree, s: LineageSave): LearnedTalent[] =>
  tree.nodes
    .filter((n) => n.kind === 'talent' && rankOf(s, n.id) > 0)
    .map((n) => ({ place: talentOfNode(n), rank: rankOf(s, n.id) }));

/** Сколько рангов талантов изучено всего (для сводки в интерфейсе). */
export const talentPointsSpent = (tree: Tree, s: LineageSave): number =>
  tree.nodes.reduce((a, n) => a + (n.kind === 'talent' ? rankOf(s, n.id) : 0), 0);

/** Перк героя и его уровень. */
export interface OwnedPerk {
  readonly perk: PerkDef;
  readonly level: number;
}

/**
 * Перки, доступные герою, с уровнями: все купленные в линейке плюс бесплатные стартовые каждого
 * открытого класса. Метаморфоза ничего не забирает — у переходного класса в руках и перки
 * подкласса, и свои.
 */
export const ownedPerks = (tree: Tree, s: LineageSave): OwnedPerk[] => {
  const out: OwnedPerk[] = [];
  for (const cls of classesOfLineage(tree.id)) {
    for (const perk of perksOfClass(cls)) {
      const n = tree.byId.get(`perk/${cls}/${perk.slot}`);
      if (!n) continue;
      const level = perk.slot === 'start' ? (isClassOwned(tree, s, cls) ? 1 : 0) : rankOf(s, n.id);
      if (level > 0) out.push({ perk, level });
    }
  }
  return out;
};

/** Id перков героя по порядку (для сводок и проверок). */
export const activePerkIds = (tree: Tree, s: LineageSave): string[] =>
  ownedPerks(tree, s).map((o) => o.perk.id);

/** Есть ли что купить прямо сейчас (для красной точки на иконке героя). */
export const anyAffordable = (tree: Tree, s: LineageSave, souls: Souls): boolean =>
  tree.nodes.some((n) => isPurchasable(n) && canInvest(tree, s, n) && costOf(s, n) <= souls);

export const cheapestAvailable = (tree: Tree, s: LineageSave): Souls => {
  let best = Infinity;
  for (const n of tree.nodes) {
    if (isPurchasable(n) && canInvest(tree, s, n)) best = Math.min(best, costOf(s, n));
  }
  return Souls.of(best);
};

/** Таланты класса — для панели дерева. */
export const classTalents = placesOfClass;
