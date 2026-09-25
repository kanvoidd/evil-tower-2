import { Ratio, Turns } from '../../../../shared';
import { defineAbility } from '../../../abilities/defineAbility';
import { FULL_BAR } from '../../../abilities/fullBar';

// Способности, которые открывает «Пиромант». Где они стоят в дереве — `perks` в classes/pyromancer.ts.

/** «Поджог». */
export const ignite = defineAbility({
  id: 'ignite',
  behavior: 'ignite',
  params: { burn: Ratio.of(0.3), turns: Turns.of(3) },
  cost: 2,
  target: 'enemy',
  cooldown: 1,
});

/** «Огненный шар». */
export const fireball = defineAbility({
  id: 'fireball',
  behavior: 'fireball',
  params: { dmg: Ratio.of(1.2), splash: Ratio.of(0.7), burn: Ratio.of(0.25), turns: Turns.of(3) },
  cost: 0,
  target: 'enemy',
  cooldown: 3,
});

/** «Детонация». */
export const detonate = defineAbility({
  id: 'detonate',
  behavior: 'detonate',
  params: { blastMul: Ratio.of(2), splashMul: Ratio.of(1) },
  cost: 5,
  target: 'self',
  cooldown: 4,
});

/** «Инферно». */
export const inferno = defineAbility({
  id: 'inferno',
  behavior: 'inferno',
  params: { burn: Ratio.of(0.4), turns: Turns.of(5) },
  cost: FULL_BAR,
  target: 'self',
  once: true,
});
