import { combatEvents } from './combat-events/combatEvents';
import { effectEvents } from './effect-events/effectEvents';
import type { EventHandlers } from './interfaces/EventHandler';
import { lootEvents } from './loot-events/lootEvents';
import { movementEvents } from './movement-events/movementEvents';

/** Реестр показа событий боя: у каждого типа события — свой обработчик (полноту проверяет тип). */
export const EVENT_HANDLERS: EventHandlers = {
  ...combatEvents,
  ...movementEvents,
  ...lootEvents,
  ...effectEvents,
};
