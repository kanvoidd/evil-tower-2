import type { Rng } from '../../shared';
import { bossOfFloor, ENEMIES } from '../enemies/enemyRegistry';
import type { EnemyDef } from '../enemies/interfaces/EnemyDef';
import type { RoomDef } from './interfaces/RoomDef';
import type { RoomPlan } from './interfaces/RoomPlan';
import type { RoomModifier } from './room-modifiers/interfaces/RoomModifier';
import { MODIFIERS } from './room-modifiers/modifierRegistry';

/** Враги с прошлых этажей попадаются реже: вес их роли умножается на это. */
const PAST_FLOOR_WEIGHT = 0.7;
/** Предохранитель раздачи элитных надбавок: попыток найти не-босса. */
const ELITE_TRIES = 40;

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
  const weights = pool.map(
    (e) => ROLE_WEIGHT[e.role] * (e.floor === def.floor ? 1 : PAST_FLOOR_WEIGHT),
  );
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
  for (let guard = 0; guard < ELITE_TRIES && elites > 0; guard++) {
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
