import type { BranchedClassDef } from '../../../classes/interfaces/ClassDef';
import { blightShot, deadServant } from '../abilities/warlock';
import { plagueSpread } from '../talents/warlock';

/** «Чернокнижник» — подкласс мага: заражение → смерть → взрыв → распространение и слуга. */
export const warlock: BranchedClassDef = {
  id: 'warlock',
  lineage: 'mage',
  stage: 1,
  parents: ['mage'],
  bonuses: { damage: 1, health: 2 },
  branches: [
    {
      id: 'blight',
      steps: [{ perk: blightShot }, { talent: plagueSpread }, { perk: deadServant }],
    },
  ],
  branchChoice: 'all',
};
