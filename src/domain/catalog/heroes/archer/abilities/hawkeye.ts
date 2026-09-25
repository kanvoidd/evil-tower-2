import { Ratio, Turns } from '../../../../shared';
import { defineAbility } from '../../../abilities/defineAbility';

// Способности, которые открывает «Соколиный глаз». Где они стоят в дереве — `perks` в classes/hawkeye.ts.

/** «Сокол-охотник». */
export const falconHunt = defineAbility({
  id: 'falcon_hunt',
  behavior: 'falcon_hunt',
  params: { dmg: Ratio.of(1.2), stun: Turns.of(1) },
  cost: 3,
  target: 'enemy',
});

/** «Сокол-курьер». */
export const falconCourier = defineAbility({
  id: 'falcon_courier',
  behavior: 'falcon_courier',
  cost: 2,
  target: 'card',
});

/** «Орлиный взор». */
export const eagleEye = defineAbility({
  id: 'eagle_eye',
  behavior: 'eagle_eye',
  kind: 'passive',
});
