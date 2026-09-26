import type { TieredClassDef } from '../../../classes/interfaces/ClassDef';
import { backstab, bribe, coldBlood } from '../abilities/mercenary';
import { mercenaryTalents } from '../talents/mercenary';

/** «Наёмник» — базовый класс. */
export const mercenary: TieredClassDef = {
  id: 'mercenary',
  lineage: 'mercenary',
  stage: 0,
  parents: [],
  bonuses: {},
  perks: { start: backstab, p2: bribe, p3: coldBlood },
  talents: mercenaryTalents,
};
