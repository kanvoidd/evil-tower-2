import { Ratio, Turns } from '../../../../shared';
import { defineAbility } from '../../../abilities/defineAbility';

// Способности, которые открывает «Ловчий». Где они стоят — ветка в classes/huntsman.ts.

/** «Капкан»: враг, попавший на клетку, получает урон и оглушение. */
export const snare = defineAbility({
  id: 'snare',
  behavior: 'trap',
  params: { dmg: Ratio.of(0.8), stun: Turns.of(1) },
  cost: 3,
  target: 'cell',
  cooldown: 3,
});

/** «Взведённая ловушка»: изученная способность срабатывает на клетке через 1–3 хода. */
export const armedTrap = defineAbility({
  id: 'armed_trap',
  behavior: 'armed_trap',
  params: { maxDelay: Turns.of(3), charges: 2 },
  cost: 2,
  target: 'cell',
});
