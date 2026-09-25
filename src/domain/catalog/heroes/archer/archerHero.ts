import type { HeroContent } from '../interfaces/HeroContent';
import { archer } from './classes/archer';
import { arrowgod } from './classes/arrowgod';
import { hawkeye } from './classes/hawkeye';
import { sniper } from './classes/sniper';
import { archerLineage } from './lineage';

/** Содержимое линейки «Лучник»: классы — в порядке развития, базовый, второй, два финальных. */
export const ARCHER: HeroContent = {
  lineage: archerLineage,
  classes: [archer, hawkeye, arrowgod, sniper],
};
