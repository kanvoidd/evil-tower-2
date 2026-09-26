import type { TieredClassDef } from '../../../classes/interfaces/ClassDef';
import { shurikenFan, smokeScreen, substitution, windShadow } from '../abilities/ninja';
import { ninjaTalents } from '../talents/ninja';

/** «Ниндзя» — финальный класс (после «Ассасин»). */
export const ninja: TieredClassDef = {
  id: 'ninja',
  lineage: 'mercenary',
  stage: 2,
  parents: ['assassin'],
  bonuses: { dodge: 12, damage: 3 },
  perks: { start: shurikenFan, p2: substitution, p3: smokeScreen, legend: windShadow },
  talents: ninjaTalents,
};
