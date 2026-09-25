import type { ClassDef } from '../../../classes/interfaces/ClassDef';
import { armorPiercing, huntersMark, oneShot, railShot } from '../abilities/sniper';
import { sniperTalents } from '../talents/sniper';

/** «Снайпер» — финальный класс (после «Соколиный глаз»). */
export const sniper: ClassDef = {
  id: 'sniper',
  lineage: 'archer',
  stage: 2,
  parent: 'hawkeye',
  bonuses: { damage: 6, dodge: 3 },
  perks: { start: railShot, p2: armorPiercing, p3: huntersMark, legend: oneShot },
  talents: sniperTalents,
};
