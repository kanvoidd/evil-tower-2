import { ROOMS } from '../../catalog';
import { Gold, Souls } from '../../shared';
import type { GiftReward } from './interfaces/GiftReward';

/** Подарок героя, который ещё не прошёл ни одной комнаты, — и нижняя граница подарка. */
export const GIFT_BASE: GiftReward = { gold: Gold.of(70), souls: Souls.of(40) };

/** Подарок — полторы награды за прохождение самой высокой комнаты, которую герой проходил. */
export const GIFT_ROOM_SHARE = 1.5;

/**
 * «Дар башни» растёт вместе с героем: чем выше его рекорд (пройдено комнат за забег), тем больше
 * золота и душ — доля награды за самую высокую пройденную комнату, но не меньше базового подарка.
 */
export const towerGiftFor = (best: number): GiftReward => {
  const room = ROOMS[Math.min(best, ROOMS.length) - 1];
  if (!room) return GIFT_BASE;
  return {
    gold: Gold.of(Math.max(GIFT_BASE.gold, Math.round(room.clearGold * GIFT_ROOM_SHARE))),
    souls: Souls.of(Math.max(GIFT_BASE.souls, Math.round(room.clearSouls * GIFT_ROOM_SHARE))),
  };
};
