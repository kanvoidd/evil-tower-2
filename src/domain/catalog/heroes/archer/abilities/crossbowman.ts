import { defineAbility } from '../../../abilities/defineAbility';

// Способности, которые открывает «Арбалетчик». Где они стоят — ветка в classes/crossbowman.ts.

/** «Залп болтом»: дальний выстрел через карту, а в упор болт пробивает броню. */
export const boltVolley = defineAbility({
  id: 'bolt_volley',
  behavior: 'bolt_volley',
  kind: 'basic',
  params: {},
  cost: 2,
  target: 'line',
  attack: 'shot',
});

/** «Крюк-болт»: дальний враг на линии героя притягивается на соседнюю клетку. */
export const hookBolt = defineAbility({
  id: 'hook_bolt',
  behavior: 'hook',
  params: {},
  cost: 3,
  target: 'line',
  cooldown: 3,
});
