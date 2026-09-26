import type { TieredClassDef } from '../../../classes/interfaces/ClassDef';
import { earthquake, neverGiveUp, powerStrike } from '../abilities/warrior';
import { warriorTalents } from '../talents/warrior';

/** «Воин» — базовый класс. */
export const warrior: TieredClassDef = {
  id: 'warrior',
  lineage: 'warrior',
  stage: 0,
  parents: [],
  bonuses: {},
  perks: { start: powerStrike, p2: earthquake, p3: neverGiveUp },
  talents: warriorTalents,
};
