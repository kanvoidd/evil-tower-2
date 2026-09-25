import type { ClassDef } from '../../../classes/interfaces/ClassDef';
import { detonate, fireball, ignite, inferno } from '../abilities/pyromancer';

/** «Пиромант» — финальный класс (после «Магистр»). */
export const pyromancer: ClassDef = {
  id: 'pyromancer',
  lineage: 'mage',
  stage: 2,
  parent: 'magister',
  bonuses: { damage: 6, crit: 5 },
  perks: { start: ignite, p2: fireball, p3: detonate, legend: inferno },
};
