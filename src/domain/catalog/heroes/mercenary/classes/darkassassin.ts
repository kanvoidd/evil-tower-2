import type { ClassDef } from '../../../classes/interfaces/ClassDef';

/** «Тёмный ассасин» — финальный класс (после «Ассасин»). */
export const darkassassin: ClassDef = {
  id: 'darkassassin',
  lineage: 'mercenary',
  stage: 2,
  parent: 'assassin',
  bonuses: { damage: 4, crit: 10 },
};
