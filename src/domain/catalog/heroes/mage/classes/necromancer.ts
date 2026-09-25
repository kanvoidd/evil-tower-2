import type { ClassDef } from '../../../classes/interfaces/ClassDef';

/** «Некромант» — финальный класс (после «Магистр»). */
export const necromancer: ClassDef = {
  id: 'necromancer',
  lineage: 'mage',
  stage: 2,
  parent: 'magister',
  bonuses: { damage: 4, health: 6, luck: 1 },
};
