import type { ClassId } from './types';
import { CLASSES } from './data/classes';
import { ROOMS } from './data/levels';
import { Store } from './systems/Store';
import { applyBuy, canInvest, costOf, isPurchasable, TREES } from './logic/skillTree';

/** Покупает до `steps` самых дешёвых доступных узлов (приоритет: способности, класс, таланты). */
const autoSkill = (steps: number): void => {
  const tree = TREES[Store.activeLineage];
  const ls = Store.activeLineageSave;
  const pr: Record<string, number> = { perk: 0, class: 1, talent: 2, evo: 9 };
  for (let i = 0; i < steps; i++) {
    let best: (typeof tree.nodes)[number] | null = null;
    let bestScore = Infinity;
    for (const n of tree.nodes) {
      if (!isPurchasable(n) || !canInvest(tree, ls, n) || costOf(ls, n) > Store.souls) continue;
      const score = pr[n.kind] * 1_000_000 + costOf(ls, n);
      if (score < bestScore) {
        bestScore = score;
        best = n;
      }
    }
    if (!best) break;
    Store.spendSouls(costOf(ls, best));
    applyBuy(tree, ls, best);
    if (best.kind === 'class') Store.setActiveClass(best.classId!);
  }
};

/**
 * Только для разработки (import.meta.env.DEV): параметры URL для быстрой проверки состояний игры.
 * Пример: http://localhost:5173/?reset=1&class=mage&gold=5000&souls=20000&clear=8&weapon=2&armor=1
 * В продакшен-сборке этот код вырезается.
 */
export const applyDevParams = (): void => {
  const q = new URLSearchParams(location.search);
  if (![...q.keys()].length) return;
  if (q.get('reset') === '1') Store.reset();
  const cls = q.get('class') as ClassId | null;
  if (cls && CLASSES[cls]) {
    Store.unlockLineage(CLASSES[cls].lineage);
    Store.setActiveClass(cls);
  }
  const gold = Number(q.get('gold') ?? 0);
  const souls = Number(q.get('souls') ?? 0);
  if (gold) Store.addGold(gold, false);
  if (souls) Store.addSouls(souls, false);
  const clear = Number(q.get('clear') ?? -1);
  if (clear >= 0) {
    Store.data.cleared[Store.activeLineage] = ROOMS.slice(0, clear).map((r) => r.id);
  }
  if (q.get('tut') === '1') Store.data.tutorial = { fight: true, hub: true, skill: true, shop: true, perk: true };
  const wt = Number(q.get('weapon') ?? 0);
  const at = Number(q.get('armor') ?? 0);
  if (wt > 0) Store.data.weapon[Store.activeLineage] = { id: `w_${Store.activeLineage}_${wt}`, durability: 40 };
  if (at > 0) Store.data.armor = { id: `a_${at}`, durability: 40 };
  const auto = Number(q.get('autoskill') ?? 0);
  if (auto > 0) autoSkill(auto);
  Store.flush();
  history.replaceState(null, '', location.pathname);
};
