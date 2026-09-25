import { Ratio } from '../../../../shared';
import { defineAbility } from '../../../abilities/defineAbility';

// Способности, которые открывает «Маг». Где они стоят в дереве — `perks` в classes/mage.ts.

/** «Удар молнии». */
export const lightning = defineAbility({
  id: 'lightning',
  behavior: 'lightning',
  params: { dmg: Ratio.of(2.5) },
  cost: 3,
  target: 'adjacent',
});

/** «Магический выстрел». */
export const magicShot = defineAbility({
  id: 'magic_shot',
  behavior: 'magic_shot',
  params: { dmg: Ratio.of(1.5) },
  cost: 6,
  target: 'line',
  cooldown: 1,
});

/** «Цепная молния». */
export const chainLightning = defineAbility({
  id: 'chain_lightning',
  behavior: 'chain_lightning',
  params: { falloff: [Ratio.of(1), Ratio.of(0.75), Ratio.of(0.5)] },
  cost: 5,
  target: 'enemy',
  cooldown: 2,
});
