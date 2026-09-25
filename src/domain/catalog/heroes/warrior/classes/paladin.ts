import type { ClassDef } from '../../../classes/interfaces/ClassDef';

/** «Паладин» — финальный класс (после «Рыцарь»). */
export const paladin: ClassDef = {
  id: 'paladin',
  lineage: 'warrior',
  stage: 2,
  parent: 'knight',
  bonuses: { defense: 3, health: 12, parry: 5 },
};
