import type { ClassDef } from '../../../classes/interfaces/ClassDef';
import { chainLightning, lightning, magicShot } from '../abilities/mage';

/** «Маг» — базовый класс. */
export const mage: ClassDef = {
  id: 'mage',
  lineage: 'mage',
  stage: 0,
  parent: null,
  bonuses: {},
  perks: { start: lightning, p2: magicShot, p3: chainLightning },
};
