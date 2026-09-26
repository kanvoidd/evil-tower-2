import type { BranchedClassDef } from '../../../classes/interfaces/ClassDef';
import { boltVolley, hookBolt } from '../abilities/crossbowman';
import { chainYank, piercingBolt, yank } from '../talents/crossbowman';

/** «Арбалетчик» — подкласс охотника: болт пробивает броню и строй, крюк тянет врагов к себе. */
export const crossbowman: BranchedClassDef = {
  id: 'crossbowman',
  lineage: 'archer',
  stage: 1,
  parents: ['hunter'],
  bonuses: { damage: 1 },
  branches: [
    {
      id: 'crossbow',
      steps: [
        { perk: boltVolley },
        { talent: piercingBolt },
        { perk: hookBolt },
        { talent: yank },
        { talent: chainYank },
      ],
    },
  ],
  branchChoice: 'all',
};
