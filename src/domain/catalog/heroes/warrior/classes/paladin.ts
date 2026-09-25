import type { ClassDef } from '../../../classes/interfaces/ClassDef';
import { heavensWrath, holyWrath, justiceBeam, verdict } from '../abilities/paladin';

/** «Паладин» — финальный класс (после «Рыцарь»). */
export const paladin: ClassDef = {
  id: 'paladin',
  lineage: 'warrior',
  stage: 2,
  parent: 'knight',
  bonuses: { defense: 3, health: 12, parry: 5 },
  perks: { start: holyWrath, p2: justiceBeam, p3: verdict, legend: heavensWrath },
};
