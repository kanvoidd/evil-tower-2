import type { GameEvent } from '../../../domain/game-data/events';

/** Показывает события боя игроку. Разрешается, когда можно принимать следующий ход. */
export interface IAnimationPlayer {
  /** `deal` — первая раздача карт в комнате. */
  play(events: readonly GameEvent[], opts?: { deal?: boolean }): Promise<void>;
}
