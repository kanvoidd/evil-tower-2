import type { HeroContent } from '../interfaces/HeroContent';
import { mage } from './classes/mage';
import { magister } from './classes/magister';
import { necromancer } from './classes/necromancer';
import { pyromancer } from './classes/pyromancer';
import { mageLineage } from './lineage';

/** Содержимое линейки «Маг»: классы — в порядке развития, базовый, второй, два финальных. */
export const MAGE: HeroContent = {
  lineage: mageLineage,
  classes: [mage, magister, necromancer, pyromancer],
};
