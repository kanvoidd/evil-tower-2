import { Ratio } from '../../../../shared';
import { defineAbility } from '../../../abilities/defineAbility';

// Способности, которые открывает «Лучник». Где они стоят — ветка в classes/bowman.ts.

/** «Сквозной выстрел»: дальний выстрел через карту по прямой. */
export const pierceShot = defineAbility({
  id: 'pierce_shot',
  behavior: 'pierce_shot',
  kind: 'basic',
  params: {},
  cost: 2,
  target: 'line',
  attack: 'shot',
});

/** «Затаившийся стрелок»: пока герой стоит на месте, урон растёт. */
export const stillAim = defineAbility({
  id: 'still_aim',
  behavior: 'still_aim',
  kind: 'passive',
  params: { perStack: Ratio.of(0.2), maxStacks: 2 },
});
