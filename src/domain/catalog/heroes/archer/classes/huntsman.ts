import type { BranchedClassDef } from '../../../classes/interfaces/ClassDef';
import { armedTrap, snare } from '../abilities/huntsman';

/** «Ловчий» — переходный класс: в него ведёт любой подкласс охотника. Ловушки на клетки поля. */
export const huntsman: BranchedClassDef = {
  id: 'huntsman',
  lineage: 'archer',
  stage: 2,
  parents: ['bowman', 'crossbowman', 'beastmaster'],
  bonuses: { crit: 6, damage: 2, health: 3 },
  branches: [{ id: 'traps', steps: [{ perk: snare }, { perk: armedTrap }] }],
  branchChoice: 'all',
};
