import { Ratio, Turns } from '../../../../shared';
import { defineAbility } from '../../../abilities/defineAbility';
import { FULL_BAR } from '../../../abilities/fullBar';

// Способности, которые открывает «Берсерк». Где они стоят в дереве — `perks` в classes/berserk.ts.

/** «Вихрь». */
export const whirlwind = defineAbility({
  id: 'whirlwind',
  behavior: 'whirlwind',
  params: { dmg: Ratio.of(0.7) },
  cost: 4,
  target: 'self',
});

/** «Ярость». */
export const rage = defineAbility({
  id: 'rage',
  behavior: 'rage',
  kind: 'passive',
  params: { hpPerResource: 2, resource: 1 },
});

/** «Резня». */
export const carnage = defineAbility({
  id: 'carnage',
  behavior: 'carnage',
  kind: 'passive',
  params: { perKill: Ratio.of(0.2), cap: Ratio.of(0.8) },
});

/** «Безумие берсерка». */
export const madness = defineAbility({
  id: 'madness',
  behavior: 'madness',
  params: { turns: Turns.of(3), splash: Ratio.of(0.6), hpCost: Ratio.of(0.2) },
  cost: FULL_BAR,
  target: 'self',
  once: true,
});
