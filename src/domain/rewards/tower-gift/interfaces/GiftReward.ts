import type { Gold, Souls } from '../../../shared';

/** Что даёт «Дар башни». */
export interface GiftReward {
  readonly gold: Gold;
  readonly souls: Souls;
}
