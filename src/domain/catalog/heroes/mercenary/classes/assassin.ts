import type { ClassDef } from '../../../classes/interfaces/ClassDef';

/** «Ассасин» — вторая ступень (после «Наёмник»). */
export const assassin: ClassDef = {
  id: 'assassin',
  lineage: 'mercenary',
  stage: 1,
  parent: 'mercenary',
  bonuses: { crit: 8, dodge: 5, health: 3 },
};
