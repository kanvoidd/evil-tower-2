import { Ratio, Turns } from '../../../../shared';
import { defineAbility } from '../../../abilities/defineAbility';

// Способности, которые открывает «Рыцарь». Где они стоят в дереве — `perks` в classes/knight.ts.

/** «Таран щитом». */
export const shieldBash = defineAbility({
  id: 'shield_bash',
  behavior: 'shield_bash',
  params: { dmg: Ratio.of(0.9), wallMul: 2, stun: Turns.of(1) },
  cost: 3,
  target: 'adjacent',
});

/** «Боевой клич». */
export const warCry = defineAbility({
  id: 'war_cry',
  behavior: 'war_cry',
  params: { weaken: Ratio.of(0.4), cap: Ratio.of(0.75) },
  cost: 5,
  target: 'self',
});

/** «Вызов на дуэль». */
export const duel = defineAbility({
  id: 'duel',
  behavior: 'duel',
  params: { stun: Turns.of(2) },
  cost: 4,
  target: 'self',
});
