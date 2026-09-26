import type { HeroContent } from '../interfaces/HeroContent';
import { beastmaster } from './classes/beastmaster';
import { bowman } from './classes/bowman';
import { crossbowman } from './classes/crossbowman';
import { hunter } from './classes/hunter';
import { huntsman } from './classes/huntsman';
import { archerLineage } from './lineage';
import { archerBaseTree } from './talents/base';

/**
 * Содержимое линейки «Охотник» (id линейки — `archer`): классы в порядке развития — базовый,
 * три подкласса на выбор, переходный; общие характеристики — дерево «Основа».
 */
export const ARCHER: HeroContent = {
  lineage: archerLineage,
  classes: [hunter, bowman, crossbowman, beastmaster, huntsman],
  baseTree: archerBaseTree,
};
