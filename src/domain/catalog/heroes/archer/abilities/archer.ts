import { Ratio } from '../../../../shared';
import { defineAbility } from '../../../abilities/defineAbility';

// Способности, которые открывает «Лучник». Где они стоят в дереве — `perks` в classes/archer.ts.

/** «Сквозной выстрел». */
export const pierceShot = defineAbility({
  id: 'pierce_shot',
  behavior: 'pierce_shot',
  kind: 'basic',
  cost: 2,
  target: 'line',
});

/** «Косой прицел». */
export const diagonal = defineAbility({
  id: 'diagonal',
  behavior: 'diagonal',
  kind: 'passive',
});

/** «Рикошет». */
export const ricochet = defineAbility({
  id: 'ricochet',
  behavior: 'ricochet',
  params: { falloff: [Ratio.of(1), Ratio.of(0.5), Ratio.of(0.25)] },
  cost: 3,
  target: 'enemy',
});
