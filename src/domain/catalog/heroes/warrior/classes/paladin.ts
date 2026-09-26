import type { TieredClassDef } from '../../../classes/interfaces/ClassDef';
import { heavensWrath, holyWrath, justiceBeam, verdict } from '../abilities/paladin';
import { paladinTalents } from '../talents/paladin';

/** «Паладин» — финальный класс (после «Рыцарь»). */
export const paladin: TieredClassDef = {
  id: 'paladin',
  lineage: 'warrior',
  stage: 2,
  parents: ['knight'],
  bonuses: { defense: 3, health: 12, parry: 5 },
  perks: { start: holyWrath, p2: justiceBeam, p3: verdict, legend: heavensWrath },
  talents: paladinTalents,
};
