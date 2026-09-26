import type { BranchedClassDef } from '../../../classes/interfaces/ClassDef';
import { pierceShot, stillAim } from '../abilities/bowman';
import { camouflage, splitHead } from '../talents/bowman';

/** «Лучник» — подкласс охотника: дальний выстрел и стрельба с места. */
export const bowman: BranchedClassDef = {
  id: 'bowman',
  lineage: 'archer',
  stage: 1,
  parents: ['hunter'],
  bonuses: { crit: 3 },
  branches: [
    {
      id: 'bow',
      steps: [
        { perk: pierceShot },
        { talent: splitHead },
        { perk: stillAim },
        { talent: camouflage },
      ],
    },
  ],
  branchChoice: 'all',
};
