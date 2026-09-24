import type { Card } from '../../Card';

/** Стартовая колода комнаты и то, что нужно сделать, чтобы открылся выход. */
export interface DeckPlan {
  cards: Card[];
  /** Сколько врагов нужно уложить. */
  quota: number;
  /** В колоде есть босс: без его гибели выход не откроется. */
  boss: boolean;
}
