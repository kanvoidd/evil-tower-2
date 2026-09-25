import type { ClassDef } from '../../../classes/interfaces/ClassDef';
import { deckDraw, rewind, swap } from '../abilities/magister';
import { magisterTalents } from '../talents/magister';

/** «Магистр» — вторая ступень (после «Маг»). */
export const magister: ClassDef = {
  id: 'magister',
  lineage: 'mage',
  stage: 1,
  parent: 'mage',
  bonuses: { damage: 3, health: 5 },
  perks: { start: swap, p2: deckDraw, p3: rewind },
  talents: magisterTalents,
};
