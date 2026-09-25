import type { ClassDef } from '../../../classes/interfaces/ClassDef';
import { shurikenFan, smokeScreen, substitution, windShadow } from '../abilities/ninja';

/** «Ниндзя» — финальный класс (после «Ассасин»). */
export const ninja: ClassDef = {
  id: 'ninja',
  lineage: 'mercenary',
  stage: 2,
  parent: 'assassin',
  bonuses: { dodge: 12, damage: 3 },
  perks: { start: shurikenFan, p2: substitution, p3: smokeScreen, legend: windShadow },
};
