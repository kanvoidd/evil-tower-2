import { Ratio, Turns } from '../../../../shared';
import { defineAbility } from '../../../abilities/defineAbility';

// Способности, которые открывает «Ассасин». Где они стоят в дереве — `perks` в classes/assassin.ts.

/** «Танец теней». */
export const shadowDance = defineAbility({
  id: 'shadow_dance',
  behavior: 'shadow_dance',
  kind: 'passive',
  params: { extraStrikes: 2 },
});

/** «Приговор». */
export const sentence = defineAbility({
  id: 'sentence',
  behavior: 'sentence',
  params: { vuln: Ratio.of(0.5), cap: Ratio.of(1.5) },
  cost: 2,
  target: 'enemy',
});

/** «Смертельная доза». */
export const lethalDose = defineAbility({
  id: 'lethal_dose',
  behavior: 'lethal_dose',
  kind: 'passive',
  params: { poison: Ratio.of(0.1), bossPoison: Ratio.of(0.05), turns: Turns.of(3) },
});
