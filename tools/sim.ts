/**
 * Симулятор баланса: бот раз за разом идёт в забег с 1-1, между забегами тратит души и золото
 * как средний игрок. Печатает забеги-рекорды, время и докуда герой доходит в среднем.
 * Запуск: npm run sim -- [warrior|mage|archer|mercenary] [повторов для оценки] [коэффициент награды]
 * RUNS=<n> — сколько забегов максимум.
 */
import type { ClassId, EquipmentSave, LineageId, TalentPath } from '../src/domain/catalog';
import { CLASSES } from '../src/domain/catalog/classes';
import { type ItemDef, ITEMS } from '../src/domain/catalog/items';
import { ROOMS } from '../src/domain/catalog/levels';
import { FULL_BAR, type PerkDef } from '../src/domain/catalog/perks';
import { needsRegen } from '../src/domain/combat/auto-use/autoUse';
import { Grid } from '../src/domain/combat/engine';
import {
  type BattleCarryStats,
  type RoomBattle,
  RoomBattleFactory,
} from '../src/domain/combat/room-battle';
import {
  applyBuy,
  canInvest,
  costOf,
  isPurchasable,
  newLineageSave,
  TREES,
} from '../src/domain/progression/skill-tree';
import { buildPlayerStats } from '../src/domain/progression/stats/stats';
import { makeRng } from '../src/domain/shared/rng/rng';

const lineage = (process.argv[2] ?? 'warrior') as LineageId;
const N = Number(process.argv[3] ?? 20);
const FARM = Number(process.argv[4] ?? 1);
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
  const upgrade = (
    list: ItemDef[],
    cur: EquipmentSave | null,
    slot: 'weapon' | 'armor',
  ): EquipmentSave | null => {
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
  // маг без маны беспомощен: зелья восстановления он берёт с собой на весь предел лавки
  while (lineage === 'mage' && gold >= 85 && consumables.potion_regen < 3) {
    gold -= 85;
    consumables.potion_regen++;
  }
};

/** Способности, которые бот применять не умеет (чистая утилита — ими играет человек). */
const SKIP = new Set(['swap', 'deck_draw', 'bribe', 'falcon_courier', 'rewind']);
/** Способности без цели, выгодные только при куче врагов. */
const CROWD = new Set([
  'earthquake',
  'whirlwind',
  'verdict',
  'detonate',
  'arrow_rain',
  'shuriken_fan',
  'heavens_wrath',
  'starfall',
  'inferno',
  'dead_harvest',
  'wind_shadow',
  'shadow_reap',
]);

/** Событие, по которому видно, что способность что-то изменила. */
const CHANGED = new Set([
  'hit',
  'kill',
  'heal',
  'shield',
  'status',
  'boost',
  'swap',
  'slide',
  'rewind',
  'gold',
  'souls',
]);

/**
 * Сколько ресурса нельзя разменивать. У мага основной удар — платная молния, и остаться
 * без маны в окружении значит погибнуть, поэтому цену молнии бот держит в запасе.
 */
const reserveOf = (battle: RoomBattle): { perkId: string; cost: number } | null => {
  if (battle.stats.attack.melee) return null;
  const basic = (battle.stats.abilities as PerkDef[]).find((p) => p.target === 'adjacent');
  return basic ? { perkId: basic.id, cost: basic.cost ?? 0 } : null;
};

const tryPerk = (battle: RoomBattle, dud: Set<string>): boolean => {
  const enemies = battle.cards.filter((c) => c?.kind === 'enemy').length;
  const reserve = reserveOf(battle);
  for (const perk of battle.stats.abilities as PerkDef[]) {
    if (SKIP.has(perk.ability) || dud.has(perk.id)) continue;
    if (!battle.perkReady(perk).ok) continue;
    // всё, кроме самого основного удара, не имеет права съесть запас на него
    if (
      reserve &&
      perk.id !== reserve.perkId &&
      battle.res - battle.perkCostOf(perk) < reserve.cost
    )
      continue;
    const full = perk.cost === FULL_BAR;
    if (CROWD.has(perk.ability) && enemies < (full ? 4 : 2)) continue;
    if (full && enemies < 4) continue;
    if (perk.target === 'self') {
      const r = battle.usePerk(perk.id);
      if (!r.ok) continue;
      // усиление, которое ничего не поменяло, бот больше в этой комнате не трогает
      if (!r.events.some((e) => CHANGED.has(e.type))) dud.add(perk.id);
      return true;
    }
    // ищем цель: самый опасный достижимый враг
    let best = Grid.NO_CELL;
    let bestScore = -1e9;
    for (const cell of Grid.CELLS) {
      const card = battle.cards[cell];
      if (!card) continue;
      if (!battle.perkTargetOk(perk, cell)) continue;
      const score = card.kind === 'enemy' ? card.atk * 3 + card.hp * 0.2 : -100;
      if (score > bestScore) {
        bestScore = score;
        best = cell;
      }
    }
    if (best < 0 || bestScore < 0) continue;
    if (!battle.usePerk(perk.id).ok) continue;
    if (!battle.tap(best).ok) battle.cancelPerk();
    return true;
  }
  return false;
};

const CELL_DIST = (a: number, b: number): number =>
  Math.abs(Math.floor(a / 3) - Math.floor(b / 3)) + Math.abs((a % 3) - (b % 3));

/** Сколько врагов достанет рука (или молния) с этой клетки. */
const adjacentEnemies = (battle: RoomBattle, cell: number): number => {
  let n = 0;
  for (let c = 0; c < 9; c++)
    if (battle.cards[c]?.kind === 'enemy' && CELL_DIST(cell, c) === 1) n++;
  return n;
};

/** Расстояние до ближайшего врага. */
const nearestEnemy = (battle: RoomBattle, cell: number): number => {
  let best = 9;
  for (let c = 0; c < 9; c++)
    if (battle.cards[c]?.kind === 'enemy') best = Math.min(best, CELL_DIST(cell, c));
  return best;
};

const bot = (battle: RoomBattle): void => {
  const dud = new Set<string>();
  /**
   * Сколько ходов бот позволяет себе добирать добычу после того, как открылся переход.
   * Враги лезть не перестают, поэтому «остаться ещё ненадолго» — это ставка, а не халява:
   * задержался — потерял здоровье, ушёл раньше — бросил золото на поле.
   */
  let loot = 6;
  // колода бесконечна: комната кончается шагом на переход, а не зачисткой поля
  for (let guard = 0; guard < 1200 && !battle.over; guard++) {
    const exitCell = battle.cards.findIndex((c) => c?.kind === 'exit');
    const leaving = exitCell >= 0 && (loot <= 0 || battle.hp < battle.stats.maxHp * 0.55);
    if (exitCell >= 0) loot--;
    if (leaving) {
      // идём к переходу: любое действие оценивается тем, насколько оно к нему приближает
      let best = Grid.NO_CELL;
      let bestScore = -1e9;
      for (const cell of Grid.CELLS) {
        if (battle.actionFor(cell).kind === 'none') continue;
        const score =
          cell === exitCell
            ? 1000
            : -CELL_DIST(cell, exitCell) * 10 - (battle.cards[cell]?.kind === 'enemy' ? 5 : 0);
        if (score > bestScore) {
          bestScore = score;
          best = cell;
        }
      }
      if (best >= 0 && battle.tap(best).ok) continue;
    }
    // проверяем результат: расходник может быть недоступен (артефакты — только у магов),
    // иначе бот зациклится на бесполезной попытке и не сделает ни одного хода
    if (
      battle.hp <= battle.stats.maxHp * 0.45 &&
      battle.consumables.potion_heal > 0 &&
      battle.useItem('potion_heal').ok
    )
      continue;
    if (
      battle.consumables.artifact > 0 &&
      battle.cards.filter((c) => c?.kind === 'enemy').length >= 3 &&
      battle.useItem('artifact').ok
    )
      continue;
    // как у игрока с автоприменением: ресурса нет на основной удар, а шкала почти пуста
    if (needsRegen(battle) && battle.useItem('potion_regen').ok) continue;
    if (tryPerk(battle, dud)) continue;
    let bestCell = Grid.NO_CELL;
    let bestScore = -1e9;
    for (const cell of Grid.CELLS) {
      const card = battle.cards[cell];
      if (!card) continue;
      const a = battle.actionFor(cell);
      if (a.kind === 'none') continue;
      let score: number;
      if (card.kind === 'enemy') {
        if (battle.wouldKill(cell)) score = 100 + card.atk * 3;
        else if (a.kind === 'ranged') score = 60 + card.atk * 2;
        else score = 20 - card.atk * 2.5 - card.hp * 0.25 + (card.stun > 0 ? 40 : 0);
      } else if (card.kind === 'exit') score = -10;
      else score = card.kind === 'chest' || card.kind === 'gold' ? 50 : 45;
      if (score > bestScore) {
        bestScore = score;
        bestCell = cell;
      }
    }
    // Ни одной карты под рукой (так живёт маг: рукой он не бьёт вовсе) — шагаем на пустую
    // клетку поближе к врагу. Ход по пустому полю теперь разрешён и считается полноценным.
    if (bestCell < 0) {
      for (const cell of Grid.CELLS) {
        if (battle.cards[cell] || battle.actionFor(cell).kind !== 'move') continue;
        // выход открыт — идём к переходу, а не к врагам
        const score = battle.exitOpen
          ? -nearestEnemy(battle, cell)
          : adjacentEnemies(battle, cell) * 10 - nearestEnemy(battle, cell);
        if (score > bestScore) {
          bestScore = score;
          bestCell = cell;
        }
      }
    }
    if (bestCell < 0) break;
    if (!battle.tap(bestCell).ok) break;
  }
};

/**
 * Забег как в игре: с 1-1 комната за комнатой, здоровье и ресурс переходят дальше, пройденная
 * комната сразу платит сумку, души и бонус; гибель отнимает только добычу текущей комнаты.
 */
/** Сколько прочности съел последний забег (оружие, доспех). */
let wear = { w: 0, a: 0 };

const runTower = (): { rooms: number; turns: number; gold: number; souls: number } => {
  let carry: BattleCarryStats | undefined;
  let rooms = 0;
  let turns = 0;
  let got = { gold: 0, souls: 0 };
  wear = { w: 0, a: 0 };
  for (let i = 0; i < ROOMS.length; i++) {
    const room = ROOMS[i];
    const stats = buildPlayerStats({ classId, lineage: ls, weapon, armor });
    const battle = RoomBattleFactory.standard().create({
      room,
      stats,
      weapon,
      armor,
      consumables: { ...consumables },
      rng: makeRng(seed++),
      carry,
    });
    battle.start();
    bot(battle);
    turns += battle.totals.turns;
    wear.w += (weapon?.durability ?? 0) - (battle.weapon?.durability ?? 0);
    wear.a += (armor?.durability ?? 0) - (battle.armor?.durability ?? 0);
    // износ и расходники берём такими, какими их оставил бой
    if (weapon) weapon = battle.weapon && battle.weapon.durability > 0 ? battle.weapon : null;
    if (armor) armor = battle.armor && battle.armor.durability > 0 ? battle.armor : null;
    Object.assign(consumables, battle.consumables);
    if (battle.over !== 'win') break;
    rooms++;
    const g = Math.round((battle.totals.gold + room.clearGold) * FARM);
    const so = Math.round((battle.totals.souls + room.clearSouls) * FARM);
    got = { gold: got.gold + g, souls: got.souls + so };
    carry = battle.carryOut();
  }
  gold += got.gold;
  souls += got.souls;
  return { rooms, turns, ...got };
};

const SEC_PER_TURN = 3;
const SEC_PER_ROOM = 8;
const SEC_PER_RUN = 45;
const MAX_RUNS = Number(process.env.RUNS ?? 400);
console.log(`Линейка: ${lineage}, повторов забега на точку: ${N}, фарм x${FARM}`);
console.log(
  'run | rooms | best | minutes | +souls | +gold | class      | HP DMG DEF crit | reach p50/p90',
);
let seed = Number(process.env.SEED ?? 1);
let seconds = 0;
let best = 0;
const milestones: Array<[number, number, number]> = [];

/** Насколько далеко этот герой доходит сейчас: медиана и 90-й процентиль по N забегам (без трат). */
const probe = (): [number, number] => {
  const save = {
    gold,
    souls,
    weapon: weapon && { ...weapon },
    armor: armor && { ...armor },
    cons: { ...consumables },
  };
  const reach: number[] = [];
  for (let k = 0; k < N; k++) {
    reach.push(runTower().rooms);
    Object.assign(consumables, save.cons);
    weapon = save.weapon && { ...save.weapon };
    armor = save.armor && { ...save.armor };
  }
  gold = save.gold;
  souls = save.souls;
  reach.sort((a, b) => a - b);
  return [reach[Math.floor(N * 0.5)], reach[Math.min(N - 1, Math.floor(N * 0.9))]];
};

const EVERY = Number(process.env.EVERY ?? 10);
for (let r = 1; r <= MAX_RUNS && best < ROOMS.length; r++) {
  spendSouls();
  shop();
  // докуда этот герой (после покупок) доходит в среднем — оцениваем до самого забега
  const [p50, p90] = N > 0 ? probe() : [NaN, NaN];
  const st = buildPlayerStats({ classId, lineage: ls, weapon, armor });
  const res = runTower();
  seconds += res.turns * SEC_PER_TURN + (res.rooms + 1) * SEC_PER_ROOM + SEC_PER_RUN;
  const record = res.rooms > best;
  if (record) {
    for (let f = Math.floor(best / 5) + 1; f <= Math.floor(res.rooms / 5); f++)
      milestones.push([f, r, Math.round(seconds / 60)]);
    best = res.rooms;
  }
  if (record || r % EVERY === 0) {
    console.log(
      `${String(r).padStart(3)} | ${String(res.rooms).padStart(5)} | ${String(best).padStart(4)} | ${(seconds / 60).toFixed(0).padStart(7)} | ${String(res.souls).padStart(6)} | ${String(res.gold).padStart(5)} | ${CLASSES[classId].id.padEnd(10)} | ${st.maxHp} ${st.damage} ${st.defense} ${Math.round(st.crit)}% | ${Number.isNaN(p50) ? '' : `${p50}/${p90}`} | wear ${(wear.w / Math.max(1, res.rooms)).toFixed(1)}/${(wear.a / Math.max(1, res.rooms)).toFixed(1)} | t/room ${(res.turns / (res.rooms + 1)).toFixed(1)}`,
    );
  }
}
console.log(
  'этаж пройден впервые: ' +
    milestones.map(([f, r, m]) => `${f}: забег ${r}, ${m} мин`).join(' · '),
);
