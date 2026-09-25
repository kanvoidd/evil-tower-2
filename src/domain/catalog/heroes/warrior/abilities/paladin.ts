import { Ratio, Turns } from '../../../../shared';
import { defineAbility } from '../../../abilities/defineAbility';
import { FULL_BAR } from '../../../abilities/fullBar';

// Способности, которые открывает «Паладин». Где они стоят в дереве — `perks` в classes/paladin.ts.

/** «Святая кара». */
export const holyWrath = defineAbility({
  id: 'holy_wrath',
  behavior: 'holy_wrath',
  params: { dmg: Ratio.of(1.5), holyDmg: Ratio.of(3) },
  cost: 3,
  target: 'adjacent',
});

/** «Луч правосудия». */
export const justiceBeam = defineAbility({
  id: 'justice_beam',
  behavior: 'justice_beam',
  params: { dmg: Ratio.of(1), holyDmg: Ratio.of(2) },
  cost: 5,
  target: 'enemy',
});

/** «Вердикт». */
export const verdict = defineAbility({
  id: 'verdict',
  behavior: 'verdict',
  params: { limit: Ratio.of(1.2) },
  cost: 6,
  target: 'self',
});

/** «Гнев небес». */
export const heavensWrath = defineAbility({
  id: 'heavens_wrath',
  behavior: 'heavens_wrath',
  params: { dmg: Ratio.of(2), holyDmg: Ratio.of(4), stun: Turns.of(2) },
  cost: FULL_BAR,
  target: 'self',
  once: true,
});
