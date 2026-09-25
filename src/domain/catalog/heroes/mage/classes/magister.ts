import type { ClassDef } from '../../../classes/interfaces/ClassDef';

/** «Магистр» — вторая ступень (после «Маг»). */
export const magister: ClassDef = {
  id: 'magister',
  lineage: 'mage',
  stage: 1,
  parent: 'mage',
  bonuses: { damage: 3, health: 5 },
};
