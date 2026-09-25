import type { GameEvent } from '../../../../domain/combat';
import type { EventStage } from './EventStage';

/** Событие боя по его типу. */
export type EventOf<K extends GameEvent['type']> = Extract<GameEvent, { type: K }>;

/**
 * Показ одного события: анимация, звук, подпись, обновление панелей. Обещание разрешается, когда
 * можно показывать следующее. `deal` — первая раздача карт в комнате.
 */
export type EventHandler<K extends GameEvent['type']> = (
  ev: EventOf<K>,
  stage: EventStage,
  deal: boolean,
) => void | Promise<void>;

/** Обработчики всех событий боя — по одному на тип. */
export type EventHandlers = { [K in GameEvent['type']]: EventHandler<K> };
