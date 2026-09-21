import type { AutoSkillSave, LineageSave } from '../types';
import { applyBuy, costOf, isPurchasable, nodeState, type Tree, type TreeNode } from './skillTree';

export const DEFAULT_AUTO_SKILL: AutoSkillSave = { on: false, chain: 'damage', alt: false };

/**
 * Ветка «по умолчанию» для автопрокачки — по последнему купленному игроком улучшению:
 * его цепочка (урон / здоровье / защита) и, если оно стояло на развилке, тип выбора (основной или особый стат).
 * Без покупок в дереве возвращает null — тогда остаются прежние настройки.
 */
export const inferBranch = (tree: Tree, save: LineageSave): Pick<AutoSkillSave, 'chain' | 'alt'> | null => {
  for (let i = save.owned.length - 1; i >= 0; i--) {
    const n = tree.byId.get(save.owned[i]);
    if (n && n.kind === 'stat' && n.chain) return { chain: n.chain, alt: n.excl !== undefined ? !!n.alt : false };
  }
  return null;
};

/** Что запомнить после ручной покупки узла: у характеристики — её ветка (и тип выбора на развилке), у остального — ничего. */
export const branchOf = (n: TreeNode): Partial<Pick<AutoSkillSave, 'chain' | 'alt'>> => {
  if (n.kind !== 'stat' || !n.chain) return {};
  return n.excl !== undefined ? { chain: n.chain, alt: !!n.alt } : { chain: n.chain };
};

/** Почему автопрокачка остановилась: 'souls' — не хватает душ, 'meta' — впереди метаморфоза, 'done' — ветка пройдена. */
export type AutoStop = 'souls' | 'meta' | 'done';

export interface AutoSkillPlan {
  buys: TreeNode[];
  spent: number;
  stop: AutoStop;
}

/** Узлы выбранной ветки: её характеристики и перки-«ворота» между сегментами (без них вниз не пройти). */
const onBranch = (n: TreeNode, cfg: AutoSkillSave): boolean => (n.kind === 'stat' ? n.chain === cfg.chain : n.kind === 'perk');

/** Допуск по высоте: узлы развилки лежат почти на одном уровне. */
const LEVEL_EPS = 40;

/**
 * Что купит автопрокачка: по одному узлу выбранной ветки сверху вниз, пока хватает душ.
 * Никогда не покупает метаморфозу (смену класса — решение игрока); на развилках берёт основной или особый стат по настройке.
 * Работает на копии сохранения — ничего не меняет.
 */
export const planAutoSkill = (tree: Tree, save: LineageSave, souls: number, cfg: AutoSkillSave): AutoSkillPlan => {
  const sim: LineageSave = { owned: [...save.owned], last: save.last };
  const buys: TreeNode[] = [];
  let left = souls;
  let spent = 0;
  for (let guard = 0; guard < 900; guard++) {
    const cands = tree.nodes.filter((n) => isPurchasable(n) && onBranch(n, cfg) && nodeState(tree, sim, n) === 'available');
    if (!cands.length) {
      const meta = tree.nodes.some((n) => n.kind === 'class' && nodeState(tree, sim, n) === 'available');
      return { buys, spent, stop: meta ? 'meta' : 'done' };
    }
    const top = Math.min(...cands.map((n) => n.y));
    const level = cands.filter((n) => n.y - top < LEVEL_EPS).sort((a, b) => costOf(a) - costOf(b));
    const pick = level.find((n) => n.kind === 'stat' && !!n.alt === cfg.alt) ?? level[0];
    const cost = costOf(pick);
    if (cost > left) return { buys, spent, stop: 'souls' };
    left -= cost;
    spent += cost;
    applyBuy(tree, sim, pick);
    buys.push(pick);
  }
  return { buys, spent, stop: 'souls' };
};
