import type { HeroContent } from '../interfaces/HeroContent';
import { berserk } from './classes/berserk';
import { knight } from './classes/knight';
import { paladin } from './classes/paladin';
import { warrior } from './classes/warrior';
import { warriorLineage } from './lineage';

/** Содержимое линейки «Воин»: классы — в порядке развития, базовый, второй, два финальных. */
export const WARRIOR: HeroContent = {
  lineage: warriorLineage,
  classes: [warrior, knight, berserk, paladin],
};
