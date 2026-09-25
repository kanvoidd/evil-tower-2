import type { TalentPath } from '../../catalog';
import { Souls } from '../../shared';
import {
  applyBuy,
  canInvest,
  costOf,
  isPurchasable,
  type Tree,
  type TreeNode,
} from '../skill-tree';
import type { LineageSave } from '../skill-tree/interfaces/LineageSave';
import type { AutoSkillSave } from './interfaces/AutoSkillSave';

/** Предохранитель цикла покупок: столько узлов нет ни в одном дереве. */
const MAX_PURCHASES = 900;

export const DEFAULT_AUTO_SKILL: AutoSkillSave = { on: false, path: 'attack' };

/**
 * Путь «по умолчанию» для автопрокачки — по последнему таланту, который игрок прокачал сам.
 * Без покупок возвращает null: тогда остаются прежние настройки.
 */
export const inferBranch = (tree: Tree, save: LineageSave): Pick<AutoSkillSave, 'path'> | null => {
  const n = tree.byId.get(save.last);
  if (n?.kind === 'talent' && n.path) return { path: n.path };
  return null;
};

/** Что запомнить после ручной покупки: у таланта — его путь, у перка и класса — ничего. */
export const branchOf = (n: TreeNode): Partial<Pick<AutoSkillSave, 'path'>> =>
  n.kind === 'talent' && n.path ? { path: n.path } : {};

/** Почему автопрокачка остановилась: 'souls' — не хватает душ, 'meta' — впереди метаморфоза, 'done' — всё изучено. */
export type AutoStop = 'souls' | 'meta' | 'done';

export interface AutoSkillPlan {
  buys: TreeNode[];
  spent: Souls;
  stop: AutoStop;
}

/** Узлы выбранного пути: его таланты и перки-«ворота» между ярусами (без них вниз не пройти). */
const onBranch = (n: TreeNode, path: TalentPath): boolean =>
  n.kind === 'talent' ? n.path === path : n.kind === 'perk';

/**
 * Что купит автопрокачка: сверху вниз по выбранному пути, ранг за рангом, пока хватает душ.
 * Метаморфозу (смену класса) не покупает никогда — это решение игрока. Работает на копии сохранения.
 */
export const planAutoSkill = (
  tree: Tree,
  save: LineageSave,
  souls: Souls,
  cfg: AutoSkillSave,
): AutoSkillPlan => {
  const sim: LineageSave = { ranks: { ...save.ranks }, last: save.last };
  const buys: TreeNode[] = [];
  let left: number = souls;
  let spent = 0;
  for (let guard = 0; guard < MAX_PURCHASES; guard++) {
    const cands = tree.nodes.filter(
      (n) => isPurchasable(n) && onBranch(n, cfg.path) && canInvest(tree, sim, n),
    );
    if (!cands.length) {
      const meta = tree.nodes.some((n) => n.kind === 'class' && canInvest(tree, sim, n));
      return { buys, spent: Souls.of(spent), stop: meta ? 'meta' : 'done' };
    }
    // самый верхний узел; на одном уровне — самый дешёвый
    const top = Math.min(...cands.map((n) => n.row));
    const pick = cands
      .filter((n) => n.row === top)
      .sort((a, b) => costOf(sim, a) - costOf(sim, b))[0];
    const cost = costOf(sim, pick);
    if (cost > left) return { buys, spent: Souls.of(spent), stop: 'souls' };
    left -= cost;
    spent += cost;
    applyBuy(tree, sim, pick);
    buys.push(pick);
  }
  return { buys, spent: Souls.of(spent), stop: 'souls' };
};
