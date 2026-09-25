import { Ratio, Turns } from '../../../../shared';
import { defineAbility } from '../../../abilities/defineAbility';

// Способности, которые открывает «Воин». Где они стоят в дереве — `perks` в classes/warrior.ts.

/** «Мощный удар». */
export const powerStrike = defineAbility({
  id: 'power_strike',
  behavior: 'power_strike',
  params: { dmg: Ratio.of(2) },
  cost: 3,
  target: 'adjacent',
});

/** «Землетрясение». */
export const earthquake = defineAbility({
  id: 'earthquake',
  behavior: 'earthquake',
  params: { dmg: Ratio.of(0.6), stun: Turns.of(1) },
  cost: 6,
  target: 'self',
});

/** «Не сдамся». */
export const neverGiveUp = defineAbility({
  id: 'never_give_up',
  behavior: 'never_give_up',
  kind: 'passive',
  params: { hpLeft: 1, shockMul: 2 },
});
