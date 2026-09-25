import type { ClassDef } from '../../../classes/interfaces/ClassDef';
import { corpseBlast, deadHarvest, ghosts, voodoo } from '../abilities/necromancer';

/** «Некромант» — финальный класс (после «Магистр»). */
export const necromancer: ClassDef = {
  id: 'necromancer',
  lineage: 'mage',
  stage: 2,
  parent: 'magister',
  bonuses: { damage: 4, health: 6, luck: 1 },
  perks: { start: corpseBlast, p2: ghosts, p3: voodoo, legend: deadHarvest },
};
