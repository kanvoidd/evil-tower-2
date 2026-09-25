import type { ClassDef } from '../../../classes/interfaces/ClassDef';

/** «Ниндзя» — финальный класс (после «Ассасин»). */
export const ninja: ClassDef = {
  id: 'ninja',
  lineage: 'mercenary',
  stage: 2,
  parent: 'assassin',
  bonuses: { dodge: 12, damage: 3 },
};
