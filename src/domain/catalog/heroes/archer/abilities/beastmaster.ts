import { Ratio, Turns } from '../../../../shared';
import { defineAbility } from '../../../abilities/defineAbility';

// Способности, которые открывает «Мастер зверей». Где они стоят — ветка в classes/beastmaster.ts.

/** «Стадо кабанов»: сначала только по линии героя, на втором уровне — по любой. */
export const stampede = defineAbility({
  id: 'stampede',
  behavior: 'stampede',
  levels: [{ stun: Turns.of(1) }, { stun: Turns.of(1), anyLine: 1 }],
  cost: 4,
  target: 'cell',
  cooldown: 3,
});

/** «Сокол»: удар по одной цели и кровотечение. */
export const falcon = defineAbility({
  id: 'falcon',
  behavior: 'strike',
  params: { dmg: Ratio.of(1), bleed: Ratio.of(0.3), bleedTurns: Turns.of(3) },
  cost: 3,
  target: 'enemy',
  cooldown: 1,
});
