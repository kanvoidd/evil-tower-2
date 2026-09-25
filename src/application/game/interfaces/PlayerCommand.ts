import type { ConsumableId } from '../../../domain/catalog';

/**
 * Что сделал игрок — намерение, а не результат. Касание клетки может оказаться ударом, выстрелом,
 * шагом, подбором или наведением способности: это решает бой, а не ввод.
 */
export type PlayerCommand =
  | { type: 'select-cell'; cell: number }
  | { type: 'use-perk'; perkId: string }
  /** `auto` — расходник применило автоприменение, а не палец игрока. */
  | { type: 'use-item'; itemId: ConsumableId; auto?: boolean }
  /** Уйти из забега (с подтверждением). */
  | { type: 'escape' };
