import type { ClassDef } from '../../../classes/interfaces/ClassDef';
import { diagonal, pierceShot, ricochet } from '../abilities/archer';
import { archerTalents } from '../talents/archer';

/** «Лучник» — базовый класс. */
export const archer: ClassDef = {
  id: 'archer',
  lineage: 'archer',
  stage: 0,
  parent: null,
  bonuses: {},
  perks: { start: pierceShot, p2: diagonal, p3: ricochet },
  talents: archerTalents,
};
