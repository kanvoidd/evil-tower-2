import type { ClassDef } from '../../../classes/interfaces/ClassDef';

/** «Берсерк» — финальный класс (после «Рыцарь»). */
export const berserk: ClassDef = {
  id: 'berserk',
  lineage: 'warrior',
  stage: 2,
  parent: 'knight',
  bonuses: { damage: 4, crit: 5, health: 6 },
};
