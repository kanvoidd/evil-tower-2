/**
 * Симулятор баланса: прогоняет «бота» через все комнаты башни с типичной прокачкой.
 * Запуск: npm run sim -- [warrior|mage|archer|mercenary] [прогонов на комнату] [коэффициент фарма] [порог победы]
 */
import { CLASSES } from '../src/data/classes';
import { ITEMS, type ItemDef } from '../src/data/items';
import { ROOMS } from '../src/data/levels';
import { FULL_BAR, type PerkDef } from '../src/data/perks';
import type { ClassId, EquipmentSave, LineageId, TalentPath } from '../src/types';
import { applyBuy, canInvest, costOf, isPurchasable, newLineageSave, TREES } from '../src/logic/skillTree';
import { buildPlayerStats } from '../src/logic/stats';
import { makeRng } from '../src/logic/rng';
import { Run } from '../src/logic/run';

const lineage = (process.argv[2] ?? 'warrior') as LineageId;
const N = Number(process.argv[3] ?? 120);
const FARM = Number(process.argv[4] ?? 1);
const TARGET = Number(process.argv[5] ?? 0.7);
const tree = TREES[lineage];
const ls = newLineageSave(tree);
let gold = 0;
let souls = 0;
let weapon: EquipmentSave | null = null;
let armor: EquipmentSave | null = null;
/** Лучшие ступени, которые бот уже носил: ниже них он не опускается, а копит. */
const bestTier = { weapon: 0, armor: 0 };
const consumables = { potion_heal: 2, potion_regen: 1, artifact: 0 };
let classId: ClassId = lineage;

/** Бот тратит души так же, как средний игрок: сперва способности, потом таланты выбранного пути. */
const PATH: TalentPath = 'attack';
const KIND_PRIORITY: Record<string, number> = { perk: 0, class: 1, talent: 2, evo: 9 };

const spendSouls = (): number => {
  let bought = 0;
  for (let guard = 0; guard < 600; guard++) {
    let best: { node: (typeof tree.nodes)[number]; score: number } | null = null;
    for (const n of tree.nodes) {
      if (!isPurchasable(n) || !canInvest(tree, ls, n)) continue;
      const c = costOf(ls, n);
      if (c > souls) continue;
      // путь урона в приоритете, остальные пути докупаются, когда есть лишние души
      const pathPenalty = n.kind === 'talent' && n.path !== PATH ? 1 : 0;
      const score = (KIND_PRIORITY[n.kind] + pathPenalty) * 10_000_000 + c;
      if (!best || score < best.score) best = { node: n, score };
    }
    if (!best) break;
    souls -= costOf(ls, best.node);
    applyBuy(tree, ls, best.node);
    if (best.node.kind === 'class') classId = best.node.classId!;
    bought++;
  }
  return bought;
};

const shop = (): void => {
  const w = ITEMS.filter((i) => i.slot === 'weapon' && i.lineage === lineage);
  const a = ITEMS.filter((i) => i.slot === 'armor');
  /**
   * Разумный игрок чинит предмет заранее (пока он не сломался — это дёшево) и не скатывается
   * на пару ступеней вниз: если денег не хватает на привычный уровень, он копит.
   */
  const upgrade = (list: ItemDef[], cur: EquipmentSave | null, slot: 'weapon' | 'armor'): EquipmentSave | null => {
    if (cur && cur.durability > 0) {
      const it = list.find((i) => i.id === cur.id)!;
      if (cur.durability < it.durability * 0.55) {
        const cost = Math.ceil(it.price * 0.35 * (1 - cur.durability / it.durability));
        if (gold >= cost) {
          gold -= cost;
          cur.durability = it.durability;
        }
      }
    }
    const curTier = cur && cur.durability > 0 ? list.find((i) => i.id === cur.id)!.tier : 0;
    const floorTier = Math.max(1, bestTier[slot] - 1);
    let best: ItemDef | null = null;
    for (const it of list) {
      if (it.tier <= curTier || it.tier < floorTier || it.price > gold) continue;
      if (!best || it.tier > best.tier) best = it;
    }
    if (!best) return cur && cur.durability > 0 ? cur : null;
    gold -= best.price;
    bestTier[slot] = Math.max(bestTier[slot], best.tier);
    return { id: best.id, durability: best.durability };
  };
  weapon = upgrade(w, weapon, 'weapon');
  armor = upgrade(a, armor, 'armor');
  while (gold >= 55 && consumables.potion_heal < 5) {
    gold -= 55;
    consumables.potion_heal++;
  }
};

/** Способности, которые бот применять не умеет (чистая утилита — ими играет человек). */
const SKIP = new Set(['swap', 'deck_draw', 'bribe', 'falcon_courier', 'rewind']);
/** Способности без цели, выгодные только при куче врагов. */
const CROWD = new Set(['earthquake', 'whirlwind', 'verdict', 'detonate', 'arrow_rain', 'shuriken_fan', 'heavens_wrath', 'starfall', 'inferno', 'dead_harvest', 'wind_shadow', 'shadow_reap']);

/** Событие, по которому видно, что способность что-то изменила. */
const CHANGED = new Set(['hit', 'kill', 'heal', 'shield', 'status', 'boost', 'swap', 'slide', 'rewind', 'gold', 'souls']);

const tryPerk = (run: Run, dud: Set<string>): boolean => {
  const enemies = run.cards.filter((c) => c?.kind === 'enemy').length;
  for (const perk of run.stats.abilities as PerkDef[]) {
    if (SKIP.has(perk.ability) || dud.has(perk.id)) continue;
    if (!run.perkReady(perk).ok) continue;
    const full = perk.cost === FULL_BAR;
    if (CROWD.has(perk.ability) && enemies < (full ? 4 : 2)) continue;
    if (full && enemies < 4) continue;
    if (perk.target === 'self') {
      const r = run.usePerk(perk.id);
      if (!r.ok) continue;
      // усиление, которое ничего не поменяло, бот больше в этой комнате не трогает
      if (!r.events.some((e) => CHANGED.has(e.type))) dud.add(perk.id);
      return true;
    }
    // ищем цель: самый опасный достижимый враг
    let best = -1;
    let bestScore = -1e9;
    for (let cell = 0; cell < 9; cell++) {
      const card = run.cards[cell];
      if (!card) continue;
      if (!run.perkTargetOk(perk, cell)) continue;
      const score = card.kind === 'enemy' ? card.atk * 3 + card.hp * 0.2 : -100;
      if (score > bestScore) {
        bestScore = score;
        best = cell;
      }
    }
    if (best < 0 || bestScore < 0) continue;
    if (!run.usePerk(perk.id).ok) continue;
    if (!run.tap(best).ok) run.cancelPerk();
    return true;
  }
  return false;
};

const CELL_DIST = (a: number, b: number): number =>
  Math.abs(Math.floor(a / 3) - Math.floor(b / 3)) + Math.abs((a % 3) - (b % 3));

/** Сколько врагов достанет рука (или молния) с этой клетки. */
const adjacentEnemies = (run: Run, cell: number): number => {
  let n = 0;
  for (let c = 0; c < 9; c++) if (run.cards[c]?.kind === 'enemy' && CELL_DIST(cell, c) === 1) n++;
  return n;
};

/** Расстояние до ближайшего врага. */
const nearestEnemy = (run: Run, cell: number): number => {
  let best = 9;
  for (let c = 0; c < 9; c++) if (run.cards[c]?.kind === 'enemy') best = Math.min(best, CELL_DIST(cell, c));
  return best;
};

const bot = (run: Run): void => {
  const dud = new Set<string>();
  for (let guard = 0; guard < 500 && !run.over; guard++) {
    // проверяем результат: расходник может быть недоступен (артефакты — только у магов),
    // иначе бот зациклится на бесполезной попытке и не сделает ни одного хода
    if (run.hp <= run.stats.maxHp * 0.45 && run.consumables.potion_heal > 0 && run.useItem('potion_heal').ok) continue;
    if (run.consumables.artifact > 0 && run.cards.filter((c) => c?.kind === 'enemy').length >= 3 && run.useItem('artifact').ok) continue;
    if (tryPerk(run, dud)) continue;
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
        else score = 20 - card.atk * 2.5 - card.hp * 0.25 + (card.stun > 0 ? 40 : 0);
      } else score = card.kind === 'chest' || card.kind === 'gold' ? 50 : 45;
      if (score > bestScore) {
        bestScore = score;
        bestCell = cell;
      }
    }
    // Ни одной карты под рукой (так живёт маг: рукой он не бьёт вовсе) — шагаем на пустую
    // клетку поближе к врагу. Ход по пустому полю теперь разрешён и считается полноценным.
    if (bestCell < 0) {
      for (let cell = 0; cell < 9; cell++) {
        if (run.cards[cell] || run.actionFor(cell).kind !== 'move') continue;
        const score = adjacentEnemies(run, cell) * 10 - nearestEnemy(run, cell);
        if (score > bestScore) {
          bestScore = score;
          bestCell = cell;
        }
      }
    }
    if (bestCell < 0) break;
    if (!run.tap(bestCell).ok) break;
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

const SEC_PER_TURN = 3.2;
const SEC_PER_ROOM = 25;
console.log(`Линейка: ${lineage}, прогонов: ${N}, фарм x${FARM}, порог победы ${Math.round(TARGET * 100)}%`);
console.log('room | winrate | hpLeft | grind | minutes | souls | gold | class     | HP DMG DEF crit');
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
  if (probe.win) gold += Math.round((probe.run.totals.gold + (first ? room.clearGold : room.clearGold * 0.25)) * FARM);
  souls += Math.round(probe.run.totals.souls * FARM) + (probe.win && first ? Math.round(room.clearSouls * FARM) : 0);
  seconds += probe.run.totals.turns * SEC_PER_TURN + SEC_PER_ROOM;
  if (weapon) weapon.durability = Math.max(0, weapon.durability - Math.round(probe.run.totals.turns * 0.6));
  if (armor) armor.durability = Math.max(0, armor.durability - Math.round(probe.run.totals.turns * 0.25));
};

for (let i = 0; i < ROOMS.length; i++) {
  let grind = 0;
  let m = { wr: 0, hp: 0, turns: 0 };
  for (; grind < 150; grind++) {
    spendSouls();
    shop();
    m = measure(i);
    if (m.wr >= TARGET) break;
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
  for (let a = 0; a < 20; a++) {
    const before = seconds;
    const pr = fight(i, seed++);
    seconds = before;
    play(i, pr.win);
    if (pr.win) break;
  }
  console.log(
    `${ROOMS[i].id.padEnd(5)}| ${(m.wr * 100).toFixed(0).padStart(4)}%   | ${(m.hp * 100).toFixed(0).padStart(4)}% | ${String(grind).padStart(5)} | ${(seconds / 60).toFixed(0).padStart(7)} | ${String(souls).padStart(5)} | ${String(gold).padStart(5)} | ${CLASSES[classId].id.padEnd(9)} | ${st.maxHp} ${st.damage} ${st.defense} ${Math.round(st.crit)}%`,
  );
}
