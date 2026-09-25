import type { ClassDef } from '../../../classes/interfaces/ClassDef';

/** «Снайпер» — финальный класс (после «Соколиный глаз»). */
export const sniper: ClassDef = {
  id: 'sniper',
  lineage: 'archer',
  stage: 2,
  parent: 'hawkeye',
  bonuses: { damage: 6, dodge: 3 },
};
