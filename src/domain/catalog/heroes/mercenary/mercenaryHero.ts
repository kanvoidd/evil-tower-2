import type { HeroContent } from '../interfaces/HeroContent';
import { assassin } from './classes/assassin';
import { darkassassin } from './classes/darkassassin';
import { mercenary } from './classes/mercenary';
import { ninja } from './classes/ninja';
import { mercenaryLineage } from './lineage';

/** Содержимое линейки «Наёмник»: классы — в порядке развития, базовый, второй, два финальных. */
export const MERCENARY: HeroContent = {
  lineage: mercenaryLineage,
  classes: [mercenary, assassin, darkassassin, ninja],
};
