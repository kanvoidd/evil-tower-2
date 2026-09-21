import type { CardKind } from '../types';
import type { Rng } from '../logic/rng';
import { bossOfFloor, enemiesOfFloor, ENEMIES, FLOOR_GOLD, FLOOR_SOULS, type EnemyDef } from './enemies';

export { ENEMIES, type EnemyDef } from './enemies';

export const FLOORS = 10;
export const ROOMS_PER_FLOOR = 5;

/**
 * Комната задаётся не списком врагов, а «рецептом»: пул врагов этажа и разброс количества.
 * Настоящий состав набирается заново при каждом заходе (`rollRoom`), поэтому одна и та же
 * комната каждый раз играется по-новому — это и есть рогаликовая часть.
 */
export interface RoomDef {
  /** "этаж-номер", например "2-3". */
  id: string;
  floor: number;
  index: number;
  boss: boolean;
  /** Из кого набирается состав. */
  pool: string[];
  /** Сколько обычных врагов (без босса). */
  count: [number, number];
  gold: [number, number];
  chests: [number, number];
  heal: [number, number];
  regen: [number, number];
  /** Множитель денежных наград на этой комнате. */
  goldScale: number;
  /** Премия за первое прохождение. */
  clearGold: number;
  clearSouls: number;
}

/**
 * Случайное свойство комнаты — выпадает при каждом заходе и показывается в шапке боя.
 * Это второй рогаликовый слой: состав врагов уже случайный, а модификатор задаёт «характер» захода.
 */
export interface RoomModifier {
  id: string;
  weight: number;
  /** Только в комнатах с боссом / только без босса. */
  bossOnly?: boolean;
  noBoss?: boolean;
  minFloor?: number;
  hpMul?: number;
  atkMul?: number;
  goldMul?: number;
  soulMul?: number;
  addEnemies?: number;
  addChests?: number;
  addHeal?: number;
  /** Щит герою в начале комнаты, доля максимального здоровья. */
  shieldPct?: number;
  /** Сколько врагов получат «элитную» надбавку. */
  elites?: number;
}

/** Надбавка элитного врага: заметно крепче и злее, но и добыча вдвое. */
export const ELITE = { hp: 1.9, atk: 1.3, value: 2 } as const;

export const MODIFIERS: RoomModifier[] = [
  { id: 'plain', weight: 30 },
  { id: 'hoard', weight: 16, goldMul: 1.6, addChests: 1 },
  { id: 'swarm', weight: 14, noBoss: true, addEnemies: 3, hpMul: 0.75 },
  { id: 'elite', weight: 12, minFloor: 2, elites: 1 },
  { id: 'cursed', weight: 12, minFloor: 2, atkMul: 1.25, soulMul: 1.6 },
  { id: 'brittle', weight: 10, hpMul: 0.75, goldMul: 0.8 },
  { id: 'blessed', weight: 10, shieldPct: 0.25, addHeal: 1 },
  { id: 'champion', weight: 14, bossOnly: true, hpMul: 1.2, goldMul: 2, soulMul: 1.35 },
];

export const MODIFIER_BY_ID: Record<string, RoomModifier> = Object.fromEntries(MODIFIERS.map((m) => [m.id, m]));

const pwGold = (f: number): number => Math.pow(FLOOR_GOLD, f - 1);
const pwSouls = (f: number): number => Math.pow(FLOOR_SOULS, f - 1);

/** Разброс содержимого по номеру комнаты на этаже: чем дальше, тем гуще. */
const SHAPE: Array<{ count: [number, number]; gold: [number, number]; chests: [number, number]; heal: [number, number]; regen: [number, number] }> = [
  { count: [7, 9], gold: [3, 5], chests: [1, 2], heal: [2, 3], regen: [0, 1] },
  { count: [8, 11], gold: [3, 5], chests: [1, 3], heal: [2, 3], regen: [1, 2] },
  { count: [10, 13], gold: [4, 6], chests: [2, 3], heal: [2, 4], regen: [1, 2] },
  { count: [11, 14], gold: [4, 6], chests: [2, 4], heal: [3, 4], regen: [1, 2] },
  { count: [9, 12], gold: [5, 7], chests: [2, 4], heal: [3, 5], regen: [2, 3] },
];

/** Пул комнаты: враги своего этажа плюс крепкие с предыдущего — переход между этажами не обрывистый. */
const poolFor = (floor: number, index: number): string[] => {
  const own = enemiesOfFloor(floor).filter((e) => !e.boss);
  const prev = floor > 1 ? enemiesOfFloor(floor - 1).filter((e) => e.role === 'tough' || e.role === 'elite') : [];
  // первые комнаты этажа мягче: элита своего этажа появляется с третьей
  const list = own.filter((e) => e.role !== 'elite' || index >= 3);
  return [...list, ...prev].map((e) => e.id);
};

const room = (floor: number, index: number): RoomDef => {
  const s = SHAPE[index - 1];
  const boss = index === ROOMS_PER_FLOOR;
  const stepGold = 1 + 0.3 * (index - 1);
  return {
    id: `${floor}-${index}`,
    floor,
    index,
    boss,
    pool: poolFor(floor, index),
    count: s.count,
    gold: s.gold,
    chests: s.chests,
    heal: s.heal,
    regen: s.regen,
    goldScale: Math.round(pwGold(floor) * stepGold * 100) / 100,
    clearGold: Math.round(24 * stepGold * (boss ? 2.6 : 1) * pwGold(floor)),
    clearSouls: Math.round(22 * stepGold * (boss ? 3 : 1) * pwSouls(floor)),
  };
};

export const ROOMS: RoomDef[] = [];
for (let f = 1; f <= FLOORS; f++) {
  for (let i = 1; i <= ROOMS_PER_FLOOR; i++) ROOMS.push(room(f, i));
}

export const ROOM_BY_ID: Record<string, RoomDef> = Object.fromEntries(ROOMS.map((r) => [r.id, r]));

export const roomIndexOf = (id: string): number => ROOMS.findIndex((r) => r.id === id);

/**
 * Готовый «расклад» комнаты: конкретные враги, карты добычи и выпавший модификатор.
 * Всё, что зависит от случайности захода, собирается здесь — `Run` уже работает с готовыми числами.
 */
export interface RoomPlan {
  room: RoomDef;
  mod: RoomModifier;
  /** Список врагов с повторами; элитные помечены. */
  enemies: Array<{ id: string; elite: boolean }>;
  gold: number;
  chests: number;
  heal: number;
  regen: number;
}

const pickWeighted = (list: RoomModifier[], rng: Rng): RoomModifier => {
  const total = list.reduce((a, m) => a + m.weight, 0);
  let r = rng.next() * total;
  for (const m of list) {
    r -= m.weight;
    if (r <= 0) return m;
  }
  return list[list.length - 1];
};

/** Вес врага в наборе: слабых больше, элиты — поштучно. */
const ROLE_WEIGHT: Record<string, number> = { weak: 34, normal: 30, tough: 14, elite: 5, boss: 0 };

/** Собирает случайный состав комнаты. Один и тот же seed даёт один и тот же расклад. */
export const rollRoom = (def: RoomDef, rng: Rng): RoomPlan => {
  const allowed = MODIFIERS.filter(
    (m) => (!m.bossOnly || def.boss) && (!m.noBoss || !def.boss) && (m.minFloor ?? 1) <= def.floor,
  );
  const mod = pickWeighted(allowed, rng);

  const pool = def.pool.map((id) => ENEMIES[id]).filter(Boolean) as EnemyDef[];
  const weights = pool.map((e) => ROLE_WEIGHT[e.role] * (e.floor === def.floor ? 1 : 0.7));
  const totalW = weights.reduce((a, b) => a + b, 0);
  const draw = (): EnemyDef => {
    let r = rng.next() * totalW;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  };

  const n = rng.int(def.count[0], def.count[1]) + (mod.addEnemies ?? 0);
  const enemies: Array<{ id: string; elite: boolean }> = [];
  for (let i = 0; i < n; i++) enemies.push({ id: draw().id, elite: false });
  if (def.boss) enemies.push({ id: bossOfFloor(def.floor).id, elite: false });

  // элитные надбавки достаются не-боссам
  let elites = mod.elites ?? 0;
  for (let guard = 0; guard < 40 && elites > 0; guard++) {
    const i = rng.int(0, enemies.length - 1);
    const e = ENEMIES[enemies[i].id];
    if (e.boss || enemies[i].elite) continue;
    enemies[i].elite = true;
    elites--;
  }

  return {
    room: def,
    mod,
    enemies,
    gold: rng.int(def.gold[0], def.gold[1]),
    chests: rng.int(def.chests[0], def.chests[1]) + (mod.addChests ?? 0),
    heal: rng.int(def.heal[0], def.heal[1]) + (mod.addHeal ?? 0),
    regen: rng.int(def.regen[0], def.regen[1]),
  };
};

/** Оформление этажа: используется для иконок и фона. */
export const FLOOR_ICON_KIND: Record<number, string> = {
  1: 'crypt', 2: 'catacomb', 3: 'flood', 4: 'armory', 5: 'garden',
  6: 'lab', 7: 'frost', 8: 'forge', 9: 'library', 10: 'summit',
};

export const CARD_KINDS: CardKind[] = ['enemy', 'gold', 'chest', 'potion_heal', 'potion_regen', 'artifact'];
