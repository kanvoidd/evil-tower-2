import type { StatusKind } from '../../../types';

/** Значок состояния над карточкой: вид и сколько ходов осталось (0 — пока цель жива). */
export interface CardStatus {
  kind: StatusKind | 'ghost';
  turns: number;
}
