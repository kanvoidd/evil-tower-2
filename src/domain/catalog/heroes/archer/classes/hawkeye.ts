import type { ClassDef } from '../../../classes/interfaces/ClassDef';

/** «Соколиный глаз» — вторая ступень (после «Лучник»). */
export const hawkeye: ClassDef = {
  id: 'hawkeye',
  lineage: 'archer',
  stage: 1,
  parent: 'archer',
  bonuses: { crit: 6, damage: 2, health: 3 },
};
