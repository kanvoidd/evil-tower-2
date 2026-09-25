import { CLASSES, classesOfLineage, secondOf, terminalsOf } from '../../catalog/classes';
import { LINEAGE_ORDER } from '../../catalog/heroes';
import { PERK_BY_ID, perkId, type PerkSlot, perksOfClass, SLOT_ORDER } from '../../catalog/perks';
import {
  maxRank,
  PATH_ORDER,
  TALENT_BY_ID,
  talentChain,
  type TalentDef,
  type TalentFx,
  talentsOfClass,
  talentValue,
  talentValue2,
} from '../../catalog/talents';
import { GAMEPLAY } from '../../gameplay';
import type { ClassId, LineageId, LineageSave, TalentPath } from '../../types';
import { classCost, perkCost, talentRankCost, talentTotalCost } from '../soul-prices/soulPrices';

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
  /** Место в цепочке яруса. */
  step?: number;
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

/**
 * Геометрия блока класса. Цепочки яруса разной длины, поэтому высота яруса считается
 * по самой длинной цепочке — короткие ветки просто заканчиваются выше и ведут стрелкой вниз,
 * к общей способности.
 */
const LAYOUT = {
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
  terminalDx: 620,
};

const PATH_SLOT: Record<TalentPath, number> = { attack: -1, vitality: 0, guard: 1 };

const classBlock = (
  classId: ClassId,
  x0: number,
  y0: number,
  parents: string[],
  out: TreeNode[],
  edges: Array<[string, string]>,
): { gates: string[]; bottom: number } => {
  const cls = CLASSES[classId];
  const classNodeId = `cls/${classId}`;
  out.push({ id: classNodeId, kind: 'class', x: x0, y: y0, owner: classId, classId, parents });
  for (const p of parents) edges.push([p, classNodeId]);

  const perks = perksOfClass(classId);
  const perkNodeId = (slot: PerkSlot): string => `perk/${classId}/${slot}`;

  // стартовая способность бесплатна и открывается вместе с классом
  out.push({
    id: perkNodeId('start'),
    kind: 'perk',
    x: x0,
    y: y0 + LAYOUT.startPerk,
    owner: classId,
    slot: 'start',
    parents: [classNodeId],
  });
  edges.push([classNodeId, perkNodeId('start')]);

  let above = perkNodeId('start');
  let y = y0 + LAYOUT.startPerk;
  let gates: string[] = [];

  for (let tier = 1 as 1 | 2 | 3; tier <= 3; tier = (tier + 1) as 1 | 2 | 3) {
    const top = y + LAYOUT.gate;
    let maxLen = 1;
    gates = [];
    for (const path of PATH_ORDER) {
      const chain = talentChain(classId, tier, path);
      maxLen = Math.max(maxLen, chain.length);
      let prev = above;
      chain.forEach((t, step) => {
        const id = `tal/${t.id}`;
        out.push({
          id,
          kind: 'talent',
          x: x0 + PATH_SLOT[path] * LAYOUT.pathDx,
          y: top + step * LAYOUT.step,
          owner: classId,
          talentId: t.id,
          path,
          tier,
          step,
          ranks: maxRank(t),
          parents: [prev],
        });
        edges.push([prev, id]);
        prev = id;
      });
      if (chain.length) gates.push(prev);
    }
    y = top + (maxLen - 1) * LAYOUT.step;
    if (tier < 3) {
      const slot: PerkSlot = tier === 1 ? 'p2' : 'p3';
      if (!perks.some((p) => p.slot === slot)) break;
      const pid = perkNodeId(slot);
      y += LAYOUT.gate;
      out.push({ id: pid, kind: 'perk', x: x0, y, owner: classId, slot, parents: gates });
      for (const g of gates) edges.push([g, pid]);
      above = pid;
    }
  }

  let bottom = y;
  if (cls.stage === 2 && perks.some((p) => p.slot === 'legend')) {
    const lid = perkNodeId('legend');
    bottom = y + LAYOUT.gate;
    out.push({
      id: lid,
      kind: 'perk',
      x: x0,
      y: bottom,
      owner: classId,
      slot: 'legend',
      parents: gates,
    });
    for (const g of gates) edges.push([g, lid]);
  }
  return { gates, bottom };
};

const buildTree = (lineage: LineageId): Tree => {
  const nodes: TreeNode[] = [];
  const edges: Array<[string, string]> = [];
  const base = lineage;
  const second = secondOf(lineage);
  const terminals = terminalsOf(lineage);

  const b1 = classBlock(base, 0, 0, [], nodes, edges);
  const y2 = b1.bottom + LAYOUT.blockGap;
  const b2 = classBlock(second, 0, y2, b1.gates, nodes, edges);

  const evoId = `evo/${lineage}`;
  const evoY = b2.bottom + LAYOUT.blockGap;
  nodes.push({ id: evoId, kind: 'evo', x: 0, y: evoY, owner: second, parents: b2.gates });
  for (const p of b2.gates) edges.push([p, evoId]);

  const yT = evoY + LAYOUT.blockGap;
  terminals.forEach((t, i) => {
    classBlock(t, (i === 0 ? -1 : 1) * LAYOUT.terminalDx, yT, [evoId], nodes, edges);
  });

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const classNode = {} as Record<ClassId, TreeNode>;
  for (const n of nodes) if (n.kind === 'class') classNode[n.classId!] = n;
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  return {
    id: lineage,
    base,
    second,
    terminals,
    nodes,
    edges,
    bounds: {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    },
    byId,
    classNode,
    evoNode: byId.get(evoId)!,
  };
};

export const TREES = Object.fromEntries(LINEAGE_ORDER.map((l) => [l, buildTree(l)])) as Record<
  LineageId,
  Tree
>;

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

export type NodeState = 'owned' | 'partial' | 'available' | 'locked' | 'blocked';

export const nodeState = (tree: Tree, s: LineageSave, n: TreeNode): NodeState => {
  if (n.kind === 'evo') return satisfied(tree, s, n.id) ? 'owned' : 'locked';
  if (n.kind === 'perk' && n.slot === 'start')
    return isClassOwned(tree, s, n.owner) ? 'owned' : 'locked';
  const rank = rankOf(s, n.id);
  const gateOpen = n.parents.length === 0 || n.parents.some((p) => satisfied(tree, s, p));

  if (n.kind === 'talent') {
    if (rank >= maxRankOf(n)) return 'owned';
    if (rank > 0) return 'partial';
    return gateOpen ? 'available' : 'locked';
  }
  if (rank > 0) return 'owned';
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

export const isPurchasable = (n: TreeNode): boolean =>
  n.kind !== 'evo' && !(n.kind === 'perk' && n.slot === 'start');

/** Цена следующего шага: у таланта — очередной ранг, у способности и класса — вся покупка. */
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
): { refund: number } => {
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

// ------------------------------------------------------------------ бонусы и способности

export type TalentBonus = Partial<Record<TalentFx, number>>;

/** Сумма эффектов всех изученных талантов линейки — они тоже сохраняются при метаморфозе. */
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

/**
 * Второе значение эффектов-пар («шанс / сила»): у «Раздвоения молнии» в `v` лежит шанс,
 * а в `v2` — доля урона по второму врагу. Берём максимум, а не сумму: это одна и та же
 * механика, и складывать силу от двух классов линейки было бы неверно.
 */
export const talentBonuses2 = (tree: Tree, s: LineageSave): TalentBonus => {
  const out: TalentBonus = {};
  for (const n of tree.nodes) {
    if (n.kind !== 'talent') continue;
    const rank = rankOf(s, n.id);
    if (rank <= 0) continue;
    const def = talentOfNode(n);
    const v2 = talentValue2(def, rank);
    if (v2 > 0) out[def.fx] = Math.max(out[def.fx] ?? 0, v2);
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
export const anyAffordable = (tree: Tree, s: LineageSave, souls: number): boolean =>
  tree.nodes.some((n) => isPurchasable(n) && canInvest(tree, s, n) && costOf(s, n) <= souls);

export const cheapestAvailable = (tree: Tree, s: LineageSave): number => {
  let best = Infinity;
  for (const n of tree.nodes) {
    if (isPurchasable(n) && canInvest(tree, s, n)) best = Math.min(best, costOf(s, n));
  }
  return best;
};

/** Таланты класса — для панели дерева. */
export const classTalents = talentsOfClass;
