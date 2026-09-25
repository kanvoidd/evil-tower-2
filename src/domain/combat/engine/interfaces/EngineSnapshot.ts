import type { Card } from '../../card/Card';

/** Снимок поля и колоды — копии карт, а не ссылки: живые карты дальше меняются. */
export interface EngineSnapshot {
  board: Array<Card | null>;
  deck: Card[];
  playerCell: number;
}
