import type { ClassDef } from '../../../classes/interfaces/ClassDef';

/** «Рыцарь» — вторая ступень (после «Воин»). */
export const knight: ClassDef = {
  id: 'knight',
  lineage: 'warrior',
  stage: 1,
  parent: 'warrior',
  bonuses: { health: 10, defense: 2 },
};
