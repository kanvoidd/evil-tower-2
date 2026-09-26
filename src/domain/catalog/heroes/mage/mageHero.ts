import type { HeroContent } from '../interfaces/HeroContent';
import { arcanist } from './classes/arcanist';
import { elementalist } from './classes/elementalist';
import { mage } from './classes/mage';
import { magister } from './classes/magister';
import { warlock } from './classes/warlock';
import { mageLineage } from './lineage';
import { mageBaseTree } from './talents/base';

/**
 * Содержимое линейки «Маг»: классы в порядке развития — базовый, три подкласса на выбор,
 * переходный; общие характеристики — дерево «Основа».
 */
export const MAGE: HeroContent = {
  lineage: mageLineage,
  classes: [mage, elementalist, arcanist, warlock, magister],
  baseTree: mageBaseTree,
};
