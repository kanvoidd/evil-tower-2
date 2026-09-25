import type { ClassDef } from '../../../classes/interfaces/ClassDef';
import { duel, shieldBash, warCry } from '../abilities/knight';
import { knightTalents } from '../talents/knight';

/** «Рыцарь» — вторая ступень (после «Воин»). */
export const knight: ClassDef = {
  id: 'knight',
  lineage: 'warrior',
  stage: 1,
  parent: 'warrior',
  bonuses: { health: 10, defense: 2 },
  perks: { start: shieldBash, p2: warCry, p3: duel },
  talents: knightTalents,
};
