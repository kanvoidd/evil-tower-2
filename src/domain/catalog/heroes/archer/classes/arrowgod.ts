import type { ClassDef } from '../../../classes/interfaces/ClassDef';

/** «Бог стрел» — финальный класс (после «Соколиный глаз»). */
export const arrowgod: ClassDef = {
  id: 'arrowgod',
  lineage: 'archer',
  stage: 2,
  parent: 'hawkeye',
  bonuses: { damage: 4, crit: 8 },
};
