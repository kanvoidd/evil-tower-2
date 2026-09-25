import type { Gold, Souls } from '../../../../shared';

/** Награды комнаты: множитель золота на поле и бонус за её прохождение. */
export interface RoomRewards {
  goldScale: number;
  clearGold: Gold;
  clearSouls: Souls;
}
