import type { TieredClassDef } from '../../../classes/interfaces/ClassDef';
import { lethalDose, sentence, shadowDance } from '../abilities/assassin';
import { assassinTalents } from '../talents/assassin';

/** «Ассасин» — вторая ступень (после «Наёмник»). */
export const assassin: TieredClassDef = {
  id: 'assassin',
  lineage: 'mercenary',
  stage: 1,
  parents: ['mercenary'],
  bonuses: { crit: 8, dodge: 5, health: 3 },
  perks: { start: shadowDance, p2: sentence, p3: lethalDose },
  talents: assassinTalents,
};
