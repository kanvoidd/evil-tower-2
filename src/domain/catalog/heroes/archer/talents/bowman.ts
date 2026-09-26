import { Ratio } from '../../../../shared';
import { talent } from '../../../talents/talent';
import { modify } from '../../../talents/talentEffects';
import { pierceShot, stillAim } from '../abilities/bowman';

// Таланты «Лучника». Где они стоят — ветка в classes/bowman.ts.

/** «Раскол наконечника»: дальний выстрел задевает врагов по диагонали от цели. */
export const splitHead = talent(
  'split_head',
  modify(pierceShot, [{ diagSplash: Ratio.of(0.3) }, { diagSplash: Ratio.of(0.5) }]),
);

/** «Камуфляж»: «Затаившийся стрелок» копит больше стаков. */
export const camouflage = talent(
  'camouflage',
  modify(stillAim, [{ maxStacks: 3 }, { maxStacks: 4 }]),
);
