import type { ClassDef } from '../../../classes/interfaces/ClassDef';

/** «Пиромант» — финальный класс (после «Магистр»). */
export const pyromancer: ClassDef = {
  id: 'pyromancer',
  lineage: 'mage',
  stage: 2,
  parent: 'magister',
  bonuses: { damage: 6, crit: 5 },
};
