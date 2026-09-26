import type { TieredClassDef } from '../../../classes/interfaces/ClassDef';
import { carnage, madness, rage, whirlwind } from '../abilities/berserk';
import { berserkTalents } from '../talents/berserk';

/** «Берсерк» — финальный класс (после «Рыцарь»). */
export const berserk: TieredClassDef = {
  id: 'berserk',
  lineage: 'warrior',
  stage: 2,
  parents: ['knight'],
  bonuses: { damage: 4, crit: 5, health: 6 },
  perks: { start: whirlwind, p2: rage, p3: carnage, legend: madness },
  talents: berserkTalents,
};
