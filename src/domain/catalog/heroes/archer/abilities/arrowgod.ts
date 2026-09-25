import { Ratio } from '../../../../shared';
import { defineAbility } from '../../../abilities/defineAbility';
import { FULL_BAR } from '../../../abilities/fullBar';

// Способности, которые открывает «Бог стрел». Где они стоят в дереве — `perks` в classes/arrowgod.ts.

/** «Двойной выстрел». */
export const doubleShot = defineAbility({
  id: 'double_shot',
  behavior: 'double_shot',
  params: { dmg: Ratio.of(1) },
  cost: 3,
  target: 'enemy',
});

/** «Азарт охотника». */
export const hunterThrill = defineAbility({
  id: 'hunter_thrill',
  behavior: 'hunter_thrill',
  kind: 'passive',
});

/** «Дождь стрел». */
export const arrowRain = defineAbility({
  id: 'arrow_rain',
  behavior: 'arrow_rain',
  params: { arrows: 5, dmg: Ratio.of(0.6) },
  cost: 4,
  target: 'self',
});

/** «Звездопад». */
export const starfall = defineAbility({
  id: 'starfall',
  behavior: 'starfall',
  params: { waves: 3, dmg: Ratio.of(0.6) },
  cost: FULL_BAR,
  target: 'self',
  once: true,
});
