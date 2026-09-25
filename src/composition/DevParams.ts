import { CLASSES, ROOMS } from '../domain/catalog';
import { applyBuy, canInvest, costOf, isPurchasable, TREES } from '../domain/progression';
import type { ClassId } from '../domain/types';
import type { ProfileStore } from '../infrastructure/store/ProfileStore';

/** Покупает до `steps` самых дешёвых доступных узлов (приоритет: способности, класс, таланты). */
const autoSkill = (store: ProfileStore, steps: number): void => {
  const tree = TREES[store.profile.activeLineage];
  const ls = store.profile.activeLineageSave;
  const pr: Record<string, number> = { perk: 0, class: 1, talent: 2, evo: 9 };
  for (let i = 0; i < steps; i++) {
    let best: (typeof tree.nodes)[number] | null = null;
    let bestScore = Infinity;
    for (const n of tree.nodes) {
      if (!isPurchasable(n) || !canInvest(tree, ls, n) || costOf(ls, n) > store.profile.souls)
        continue;
      const score = pr[n.kind] * 1_000_000 + costOf(ls, n);
      if (score < bestScore) {
        bestScore = score;
        best = n;
      }
    }
    if (!best) break;
    store.profile.spendSouls(costOf(ls, best));
    applyBuy(tree, ls, best);
    if (best.kind === 'class') store.profile.setActiveClass(best.classId!);
  }
};

/**
 * Только для разработки (import.meta.env.DEV): параметры URL для быстрой проверки состояний игры.
 * Пример: http://localhost:5173/?reset=1&class=mage&gold=5000&souls=20000&clear=8&weapon=2&armor=1
 * В продакшен-сборке этот код вырезается.
 */
export const applyDevParams = (store: ProfileStore): void => {
  const q = new URLSearchParams(location.search);
  if (![...q.keys()].length) return;
  if (q.get('reset') === '1') store.reset();
  const cls = q.get('class') as ClassId | null;
  if (cls && CLASSES[cls]) {
    // класс героя выводится из дерева: продвинутый класс открываем всей цепочкой метаморфоз (без цены и ворот)
    const lineage = CLASSES[cls].lineage;
    const ls = store.profile.unlockLineage(lineage);
    for (let c: ClassId | null = cls; c && CLASSES[c].parent; c = CLASSES[c].parent)
      ls.ranks[TREES[lineage].classNode[c].id] = 1;
    store.profile.setActiveClass(cls);
  }
  const gold = Number(q.get('gold') ?? 0);
  const souls = Number(q.get('souls') ?? 0);
  if (gold) store.profile.addGold(gold, false);
  if (souls) store.profile.addSouls(souls, false);
  const clear = Number(q.get('clear') ?? -1);
  if (clear >= 0) {
    store.profile.heroSave.best = Math.min(clear, ROOMS.length);
  }
  if (q.get('tut') === '1')
    store.data.tutorial = { fight: true, hub: true, skill: true, shop: true, perk: true };
  const wt = Number(q.get('weapon') ?? 0);
  const at = Number(q.get('armor') ?? 0);
  if (wt > 0)
    store.data.weapon[store.profile.activeLineage] = {
      id: `w_${store.profile.activeLineage}_${wt}`,
      durability: 40,
    };
  if (at > 0) store.profile.heroSave.armor = { id: `a_${at}`, durability: 40 };
  const auto = Number(q.get('autoskill') ?? 0);
  if (auto > 0) autoSkill(store, auto);
  store.flush();
  history.replaceState(null, '', location.pathname);
};
