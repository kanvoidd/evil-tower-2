import type { ClassDef } from '../../../classes/interfaces/ClassDef';
import { earthquake, neverGiveUp, powerStrike } from '../abilities/warrior';

/** «Воин» — базовый класс. */
export const warrior: ClassDef = {
  id: 'warrior',
  lineage: 'warrior',
  stage: 0,
  parent: null,
  bonuses: {},
  perks: { start: powerStrike, p2: earthquake, p3: neverGiveUp },
};
