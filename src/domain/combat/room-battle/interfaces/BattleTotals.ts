import type { Gold, Souls } from '../../../shared';

/** Итоги захода в комнату. */
export interface BattleTotals {
  gold: Gold;
  souls: Souls;
  kills: number;
  damageTaken: number;
  turns: number;
}
