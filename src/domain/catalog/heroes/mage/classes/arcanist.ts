import type { BranchedClassDef } from '../../../classes/interfaces/ClassDef';
import { magicShot, shuffle, swap } from '../abilities/arcanist';
import { arcaneCharge } from '../talents/arcanist';

/** «Арканист» — подкласс мага: чистая магия и управление самим полем. */
export const arcanist: BranchedClassDef = {
  id: 'arcanist',
  lineage: 'mage',
  stage: 1,
  parents: ['mage'],
  bonuses: { health: 3 },
  branches: [
    // урон: выстрелить сейчас или копить заряд
    { id: 'damage', steps: [{ perk: magicShot }, { talent: arcaneCharge }] },
    // манипуляция: точечно переставить карты или перемешать всё поле
    { id: 'manipulation', steps: [{ perk: swap }, { perk: shuffle }] },
  ],
  branchChoice: 'all',
};
