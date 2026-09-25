import type { Gold, Souls } from '../../../shared';
/** Награда одного дня серии ежедневных наград. */
export interface DailyReward {
  gold?: Gold;
  souls?: Souls;
  heal?: number;
  regen?: number;
}
