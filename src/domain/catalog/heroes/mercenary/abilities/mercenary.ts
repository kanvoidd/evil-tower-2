import { Gold, Ratio } from '../../../../shared';
import { defineAbility } from '../../../abilities/defineAbility';

// Способности, которые открывает «Наёмник». Где они стоят в дереве — `perks` в classes/mercenary.ts.

/** «Удар в спину». */
export const backstab = defineAbility({
  id: 'backstab',
  behavior: 'backstab',
  kind: 'basic',
  cost: 4,
  target: 'enemy',
  attack: 'backstab',
});

/** «Подкуп». */
export const bribe = defineAbility({
  id: 'bribe',
  behavior: 'bribe',
  goldCost: { share: Ratio.of(0.25), min: Gold.of(5) },
  target: 'enemy',
});

/** «Хладнокровие». */
export const coldBlood = defineAbility({
  id: 'cold_blood',
  behavior: 'cold_blood',
  kind: 'passive',
  params: { resource: 3 },
});
