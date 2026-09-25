import type { ClassDef } from '../../../classes/interfaces/ClassDef';
import { backstab, bribe, coldBlood } from '../abilities/mercenary';

/** «Наёмник» — базовый класс. */
export const mercenary: ClassDef = {
  id: 'mercenary',
  lineage: 'mercenary',
  stage: 0,
  parent: null,
  bonuses: {},
  perks: { start: backstab, p2: bribe, p3: coldBlood },
};
