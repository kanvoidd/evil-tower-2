import type { BranchedClassDef } from '../../../classes/interfaces/ClassDef';
import { magicShield } from '../abilities/magister';

/** «Магистр» — переходный класс: в него ведёт любой подкласс мага. */
export const magister: BranchedClassDef = {
  id: 'magister',
  lineage: 'mage',
  stage: 2,
  parents: ['elementalist', 'arcanist', 'warlock'],
  bonuses: { damage: 3, health: 5 },
  branches: [{ id: 'arcana', steps: [{ perk: magicShield }] }],
  branchChoice: 'all',
};
