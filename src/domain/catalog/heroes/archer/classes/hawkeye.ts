import type { ClassDef } from '../../../classes/interfaces/ClassDef';
import { eagleEye, falconCourier, falconHunt } from '../abilities/hawkeye';

/** «Соколиный глаз» — вторая ступень (после «Лучник»). */
export const hawkeye: ClassDef = {
  id: 'hawkeye',
  lineage: 'archer',
  stage: 1,
  parent: 'archer',
  bonuses: { crit: 6, damage: 2, health: 3 },
  perks: { start: falconHunt, p2: falconCourier, p3: eagleEye },
};
