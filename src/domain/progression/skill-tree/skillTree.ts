/**
 * Правила дерева прокачки над купленным (`LineageSave`): состояние узлов, цены, покупка,
 * отказ от финального класса, сумма эффектов талантов и доступные способности.
 */
import {
  CLASSES,
  classesOfLineage,
  type ClassId,
  PERK_BY_ID,
  perkId,
  placesOfClass,
  powerAt,
  SLOT_ORDER,
  TALENT_PLACE_BY_ID,
  type TalentPlace,
  valueAt,
} from '../../catalog';
import { Souls } from '../../shared';
import { SOUL_PRICING } from '../soul-prices/soulPricing';
import type { BuyResult } from './interfaces/BuyResult';
import type { LineageSave } from './interfaces/LineageSave';
import type { NodeState } from './interfaces/NodeState';
import type { TalentBonus } from './interfaces/TalentBonus';
import type { Tree } from './interfaces/Tree';
import type { TreeNode } from './interfaces/TreeNode';

// ------------------------------------------------------------------ состояние узлов

export const talentOfNode = (n: TreeNode): TalentPlace => TALENT_PLACE_BY_ID[n.talentId!];

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
 * поэтому максимум у последнего таланта означает, что вся цепочка пройдена.
 */
const satisfied = (tree: Tree, s: LineageSave, id: string): boolean => {
  const n = tree.byId.get(id);
  if (!n) return false;
  if (n.kind === 'talent') return isMaxed(s, n);
  if (n.kind === 'perk' && n.slot === 'start') return isClassOwned(tree, s, n.owner);
  if (n.kind === 'evo') return n.parents.some((p) => satisfied(tree, s, p));
  return rankOf(s, n.id) > 0;
};

/** Таланта: изучен до конца, частично, доступен (ворота открыты) или закрыт. */
const talentState = (s: LineageSave, n: TreeNode, gateOpen: boolean): NodeState => {
  const rank = rankOf(s, n.id);
  if (rank >= maxRankOf(n)) return 'owned';
  if (rank > 0) return 'partial';
  return gateOpen ? 'available' : 'locked';
};

/** Финальный класс закрыт, если герой уже выбрал соседний финал своей линейки. */
const siblingTaken = (tree: Tree, s: LineageSave, n: TreeNode): boolean => {
  if (CLASSES[n.classId!].stage !== 2) return false;
  const sibling = tree.terminals.find((c) => c !== n.classId);
  return !!sibling && isClassOwned(tree, s, sibling);
};

export const nodeState = (tree: Tree, s: LineageSave, n: TreeNode): NodeState => {
  if (n.kind === 'evo') return satisfied(tree, s, n.id) ? 'owned' : 'locked';
  if (n.kind === 'perk' && n.slot === 'start')
    return isClassOwned(tree, s, n.owner) ? 'owned' : 'locked';
  const gateOpen = n.parents.length === 0 || n.parents.some((p) => satisfied(tree, s, p));
  if (n.kind === 'talent') return talentState(s, n, gateOpen);
  if (rankOf(s, n.id) > 0) return 'owned';
  if (n.kind === 'class' && siblingTaken(tree, s, n)) return 'blocked';
  return gateOpen ? 'available' : 'locked';
};

/** Можно ли ещё вкладывать души в этот узел. */
export const canInvest = (tree: Tree, s: LineageSave, n: TreeNode): boolean => {
  const st = nodeState(tree, s, n);
  return st === 'available' || st === 'partial';
};

export const isPurchasable = (n: TreeNode): boolean =>
  n.kind !== 'evo' && !(n.kind === 'perk' && n.slot === 'start');

/** Цена следующего шага: у таланта — очередной ранг, у способности и класса — вся покупка. */
export const costOf = (s: LineageSave, n: TreeNode): Souls => {
  if (n.kind === 'talent') {
    const next = rankOf(s, n.id) + 1;
    if (next > maxRankOf(n)) return Souls.of(0);
    return SOUL_PRICING.talentRank(n.owner, n.tier!, next);
  }
  if (n.kind === 'perk') return SOUL_PRICING.perk(n.owner, n.slot!);
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

export const canCancelMetamorphosis = (tree: Tree, s: LineageSave, classId: ClassId): boolean =>
  CLASSES[classId].stage === 2 &&
  isClassOwned(tree, s, classId) &&
  tree.terminals.includes(classId);

/** Сбрасывает ветку финального класса. Возвращает часть потраченного опыта душ. */
export const applyCancelMetamorphosis = (
  tree: Tree,
  s: LineageSave,
  classId: ClassId,
): { refund: Souls } => {
  let spent: number = SOUL_PRICING.metamorphosis(classId);
  for (const n of tree.nodes) {
    if (n.owner !== classId) continue;
    const rank = rankOf(s, n.id);
    if (rank <= 0) continue;
    if (n.kind === 'talent') spent += SOUL_PRICING.talentTotal(n.owner, n.tier!, rank);
    else if (n.kind === 'perk' && n.slot !== 'start') spent += SOUL_PRICING.perk(n.owner, n.slot!);
    delete s.ranks[n.id];
  }
  delete s.ranks[tree.classNode[classId].id];
  s.last = tree.classNode[CLASSES[classId].parent!].id;
  return { refund: SOUL_PRICING.refund(spent) };
};

// ------------------------------------------------------------------ бонусы и способности

/** Сумма эффектов всех изученных талантов линейки — они тоже сохраняются при метаморфозе. */
export const talentBonuses = (tree: Tree, s: LineageSave): TalentBonus => {
  const out: TalentBonus = {};
  for (const n of tree.nodes) {
    if (n.kind !== 'talent') continue;
    const rank = rankOf(s, n.id);
    if (rank <= 0) continue;
    const { effect } = talentOfNode(n).talent;
    out[effect.fx] = (out[effect.fx] ?? 0) + valueAt(effect, rank);
  }
  return out;
};

/**
 * Сила эффектов-пар «шанс / сила» (у «Раздвоения молнии» — доля урона второго разряда).
 * Берём максимум, а не сумму: это одна и та же механика, и складывать силу от двух классов
 * линейки было бы неверно. Шансы пар складываются в `talentBonuses`.
 */
export const talentBonuses2 = (tree: Tree, s: LineageSave): TalentBonus => {
  const out: TalentBonus = {};
  for (const n of tree.nodes) {
    if (n.kind !== 'talent') continue;
    const rank = rankOf(s, n.id);
    if (rank <= 0) continue;
    const { effect } = talentOfNode(n).talent;
    const power = powerAt(effect, rank);
    if (power > 0) out[effect.fx] = Math.max(out[effect.fx] ?? 0, power);
  }
  return out;
};

/** Сколько рангов талантов изучено всего (для сводки в интерфейсе). */
export const talentPointsSpent = (tree: Tree, s: LineageSave): number =>
  tree.nodes.reduce((a, n) => a + (n.kind === 'talent' ? rankOf(s, n.id) : 0), 0);

/**
 * Способности, доступные герою: все купленные в линейке плюс бесплатные стартовые каждого
 * открытого класса. Метаморфоза ничего не забирает — у пироманта в руках и заклинания мага,
 * и приёмы магистра, и своё пламя.
 */
export const activePerkIds = (tree: Tree, s: LineageSave, _active: ClassId): string[] => {
  const order = classesOfLineage(tree.id);
  const ids: string[] = [];
  for (const cls of order) {
    for (const slot of SLOT_ORDER) {
      const n = tree.byId.get(`perk/${cls}/${slot}`);
      if (!n || !PERK_BY_ID[perkId(cls, slot)]) continue;
      const owned = slot === 'start' ? isClassOwned(tree, s, cls) : rankOf(s, n.id) > 0;
      if (owned) ids.push(perkId(cls, slot));
    }
  }
  return ids;
};

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
