/**
 * Симулятор баланса: прогоняет «бота» через 15 комнат с типичной прокачкой.
 * Запуск: npm run sim -- [warrior|mage|archer|mercenary] [прогонов на комнату] [коэффициент фарма]
 */
import { CLASSES } from '../src/data/classes';
import { ITEMS, type ItemDef } from '../src/data/items';
import { ROOMS } from '../src/data/levels';
import type { ClassId, EquipmentSave, LineageId } from '../src/types';
import { applyBuy, costOf, isPurchasable, newLineageSave, nodeState, TREES } from '../src/logic/skillTree';
import { buildPlayerStats } from '../src/logic/stats';
import { makeRng } from '../src/logic/rng';
import { Run } from '../src/logic/run';

const lineage = (process.argv[2] ?? 'warrior') as LineageId;
const N = Number(process.argv[3] ?? 200);
const FARM = Number(process.argv[4] ?? 1);
const tree = TREES[lineage];
const ls = newLineageSave(tree);
let gold = 0;
let souls = 0;
let weapon: EquipmentSave | null = null;
let armor: EquipmentSave | null = null;
const consumables = { potion_heal: 2, potion_regen: 1, artifact: 0 };
let classId: ClassId = lineage;

const PRIORITY: Record<string, number> = { perk: 0, class: 1, damage: 2, health: 3, defense: 4 };

const spendSouls = (): number => {
  let bought = 0;
  for (let guard = 0; guard < 400; guard++) {
    let best: { node: (typeof tree.nodes)[number]; score: number } | null = null;
    for (const n of tree.nodes) {
      if (!isPurchasable(n) || nodeState(tree, ls, n) !== 'available') continue;
      const c = costOf(n);
      if (c > souls) continue;
      const pr = n.kind === 'stat' ? PRIORITY[n.chain!] : PRIORITY[n.kind];
      const score = pr * 10000 + c;
      if (!best || score < best.score) best = { node: n, score };
    }
    if (!best) break;
    souls -= costOf(best.node);
    applyBuy(tree, ls, best.node);
    if (best.node.kind === 'class') classId = best.node.classId!;
    bought++;
  }
  return bought;
};

const shop = (): void => {
  const w = ITEMS.filter((i) => i.slot === 'weapon' && i.lineage === lineage);
  const a = ITEMS.filter((i) => i.slot === 'armor');
  const upgrade = (list: ItemDef[], cur: EquipmentSave | null): EquipmentSave | null => {
    const curTier = cur && cur.durability > 0 ? list.find((i) => i.id === cur.id)!.tier : 0;
    const next = list.find((i) => i.tier === curTier + 1);
    if (next && gold >= next.price) {
      gold -= next.price;
      return { id: next.id, durability: next.durability };
    }
    return cur;
  };
  weapon = upgrade(w, weapon);
  armor = upgrade(a, armor);
  // ремонт
  for (const [slot, e] of [['w', weapon], ['a', armor]] as const) {
    if (!e) continue;
    const it = ITEMS.find((i) => i.id === e.id)!;
    if (e.durability < it.durability * 0.3) {
      const cost = Math.ceil(it.price * 0.5 * (1 - e.durability / it.durability));
      if (gold >= cost) {
        gold -= cost;
        e.durability = it.durability;
      }
    }
    void slot;
  }
  while (gold >= 40 && consumables.potion_heal < 4) {
    gold -= 40;
    consumables.potion_heal++;
  }
};

const bot = (run: Run): void => {
  for (let guard = 0; guard < 400 && !run.over; guard++) {
    if (run.hp <= run.stats.maxHp * 0.4 && run.consumables.potion_heal > 0) run.useItem('potion_heal');
    if (run.consumables.artifact > 0 && run.cards.filter((c) => c?.kind === 'enemy').length >= 3) run.useItem('artifact');
    let bestCell = -1;
    let bestScore = -1e9;
    for (let cell = 0; cell < 9; cell++) {
      const card = run.cards[cell];
      if (!card) continue;
      const a = run.actionFor(cell);
      if (a.kind === 'none') continue;
      let score: number;
      if (card.kind === 'enemy') {
        if (run.wouldKill(cell)) score = 100 + card.atk * 3;
        else if (a.kind === 'ranged') score = 60 + card.atk * 2;
        else score = 20 - card.atk * 2.5 - card.hp * 0.25;
      } else score = card.kind === 'chest' || card.kind === 'gold' ? 50 : 45;
      if (score > bestScore) {
        bestScore = score;
        bestCell = cell;
      }
    }
    if (bestCell < 0) break;
    run.tap(bestCell);
  }
};

const fight = (roomIdx: number, seed: number): { win: boolean; run: Run } => {
  const room = ROOMS[roomIdx];
  const stats = buildPlayerStats({ classId, lineage: ls, weapon, armor });
  const run = new Run({ room, stats, weapon, armor, consumables: { ...consumables }, rng: makeRng(seed) });
  run.start();
  bot(run);
  return { win: run.over === 'win', run };
};

const TARGET = Number(process.argv[5] ?? 0.75);
const SEC_PER_TURN = 3.2;
const SEC_PER_ROOM = 25;
console.log(`Линейка: ${lineage}, прогонов: ${N}, фарм x${FARM}, порог победы ${TARGET * 100}%`);
console.log('room | winrate | hpLeft | grind | minutes | souls | gold | class | HP DMG DEF crit');
let seed = 1;
let seconds = 0;

const measure = (i: number): { wr: number; hp: number; turns: number } => {
  let wins = 0;
  let hpLeft = 0;
  let turns = 0;
  for (let k = 0; k < N; k++) {
    const { win, run } = fight(i, seed++);
    if (win) {
      wins++;
      hpLeft += run.hp / run.stats.maxHp;
    }
    turns += run.totals.turns;
  }
  return { wr: wins / N, hp: wins ? hpLeft / wins : 0, turns: turns / N };
};

const play = (i: number, first: boolean): void => {
  const room = ROOMS[i];
  const probe = fight(i, seed++);
  // Золото из сумки сдаётся только за победу; за поражение золота нет (души остаются).
  if (probe.win) gold += Math.round((probe.run.totals.gold + (first ? room.clearGold : room.clearGold * 0.25)) * FARM);
  souls += Math.round(probe.run.totals.souls * FARM) + (probe.win && first ? Math.round(room.clearSouls * FARM) : 0);
  seconds += probe.run.totals.turns * SEC_PER_TURN + SEC_PER_ROOM;
  if (weapon) weapon.durability = Math.max(0, weapon.durability - Math.round(probe.run.totals.turns * 0.6));
  if (armor) armor.durability = Math.max(0, armor.durability - Math.round(probe.run.totals.turns * 0.25));
};

for (let i = 0; i < ROOMS.length; i++) {
  let grind = 0;
  let m = { wr: 0, hp: 0, turns: 0 };
  for (; grind < 120; grind++) {
    spendSouls();
    shop();
    m = measure(i);
    if (m.wr >= TARGET) break;
    // фарм: самая дальняя из пройденных комнат, где бот выигрывает почти всегда
    let farm = -1;
    for (let j = i - 1; j >= 0; j--) {
      const pr = fight(j, seed++);
      if (pr.win && pr.run.hp / pr.run.stats.maxHp > 0.35) {
        farm = j;
        break;
      }
    }
    if (farm < 0) farm = 0;
    play(farm, false);
  }
  const st = buildPlayerStats({ classId, lineage: ls, weapon, armor });
  // проходим комнату впервые (до победы)
  for (let a = 0; a < 20; a++) {
    const before = seconds;
    const pr = fight(i, seed++);
    seconds = before;
    play(i, pr.win);
    if (pr.win) break;
  }
  console.log(
    `${ROOMS[i].id.padEnd(4)} | ${(m.wr * 100).toFixed(0).padStart(4)}%   | ${(m.hp * 100).toFixed(0).padStart(4)}% | ${String(grind).padStart(5)} | ${(seconds / 60).toFixed(0).padStart(7)} | ${String(souls).padStart(5)} | ${String(gold).padStart(5)} | ${CLASSES[classId].id.padEnd(9)} | ${st.maxHp} ${st.damage} ${st.defense} ${Math.round(st.crit)}%`,
  );
}
