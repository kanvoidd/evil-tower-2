import type { StatusKind } from './StatusKind';

/** Значок состояния над карточкой: вид и сколько ходов осталось (0 — пока цель жива). */
export interface CardStatus {
  kind: StatusKind;
  turns: number;
}
