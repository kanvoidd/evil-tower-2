import type { CardView } from '../../board/card-view';

/**
 * Анимация удара карточки по клетке. Промис разрешается в момент касания цели —
 * следующее событие (урон, промах) показывается сразу, а возврат доигрывает в фоне.
 */
export interface IAttackAnimation {
  play(attacker: CardView, targetCell: number): Promise<void>;
}
