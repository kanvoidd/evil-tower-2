import type { ClassDef } from '../../../classes/interfaces/ClassDef';
import { arrowRain, doubleShot, hunterThrill, starfall } from '../abilities/arrowgod';

/** «Бог стрел» — финальный класс (после «Соколиный глаз»). */
export const arrowgod: ClassDef = {
  id: 'arrowgod',
  lineage: 'archer',
  stage: 2,
  parent: 'hawkeye',
  bonuses: { damage: 4, crit: 8 },
  perks: { start: doubleShot, p2: hunterThrill, p3: arrowRain, legend: starfall },
};
