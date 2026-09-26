import type { BranchedClassDef } from '../../../classes/interfaces/ClassDef';
import { falcon, stampede } from '../abilities/beastmaster';
import { airSupport, crossingRun } from '../talents/beastmaster';

/** «Мастер зверей» — подкласс охотника: звери бьют и меняют поле боя. */
export const beastmaster: BranchedClassDef = {
  id: 'beastmaster',
  lineage: 'archer',
  stage: 1,
  parents: ['hunter'],
  bonuses: { health: 3 },
  branches: [
    {
      id: 'beasts',
      steps: [
        { perk: falcon },
        { talent: airSupport },
        { perk: stampede },
        { talent: crossingRun },
      ],
    },
  ],
  branchChoice: 'all',
};
