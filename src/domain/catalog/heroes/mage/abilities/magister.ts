import { defineAbility } from '../../../abilities/defineAbility';

// Способности, которые открывает «Магистр». Где они стоят в дереве — `perks` в classes/magister.ts.

/** «Перестановка». */
export const swap = defineAbility({
  id: 'swap',
  behavior: 'swap',
  cost: 2,
  target: 'two',
  cooldown: 5,
});

/** «Жребий колоды». */
export const deckDraw = defineAbility({
  id: 'deck_draw',
  behavior: 'deck_draw',
  cost: 3,
  target: 'any_card',
  cooldown: 4,
});

/** «Откат времени». */
export const rewind = defineAbility({
  id: 'rewind',
  behavior: 'rewind',
  cost: 6,
  target: 'self',
  once: true,
});
