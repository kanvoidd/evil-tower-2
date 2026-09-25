import type { Gold, Souls } from '../../shared';

/** Что платит пройденная комната: сумка и души боя вместе с бонусом за прохождение. */
export interface RoomPay {
  gold: Gold;
  souls: Souls;
  /** Комната пройдена без единой раны. */
  flawless: boolean;
}
