import type { ClassDef } from '../../../classes/interfaces/ClassDef';
import { chainMark, deathMark, reaper, shadowReap } from '../abilities/darkassassin';
import { darkassassinTalents } from '../talents/darkassassin';

/** «Тёмный ассасин» — финальный класс (после «Ассасин»). */
export const darkassassin: ClassDef = {
  id: 'darkassassin',
  lineage: 'mercenary',
  stage: 2,
  parent: 'assassin',
  bonuses: { damage: 4, crit: 10 },
  perks: { start: deathMark, p2: chainMark, p3: shadowReap, legend: reaper },
  talents: darkassassinTalents,
};
