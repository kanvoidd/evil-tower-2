import type { GameEvent } from '../../../game-data/events';

/** Итог действия игрока: получилось ли, почему нет и что показать. */
export interface TurnResult {
  ok: boolean;
  reason?: string;
  events: GameEvent[];
}
