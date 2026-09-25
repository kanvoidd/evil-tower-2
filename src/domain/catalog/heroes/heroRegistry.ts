import { ARCHER } from './archer/archerHero';
import type { HeroContent } from './interfaces/HeroContent';
import type { LineageDef } from './interfaces/LineageDef';
import type { LineageId } from './interfaces/LineageId';
import { MAGE } from './mage/mageHero';
import { MERCENARY } from './mercenary/mercenaryHero';
import { WARRIOR } from './warrior/warriorHero';

/**
 * Все линейки игры. Порядок списка — порядок линеек в игре (выбор класса, реестры).
 *
 * Пассивки классов (ТЗ): воин — самый большой запас здоровья, лучник — самый высокий шанс крита,
 * маг — самый большой запас ресурса и артефакты, наёмник — +20% золота.
 */
export const HEROES: readonly HeroContent[] = [WARRIOR, MAGE, ARCHER, MERCENARY];

export const LINEAGES = Object.fromEntries(HEROES.map((h) => [h.lineage.id, h.lineage])) as Record<
  LineageId,
  LineageDef
>;

export const LINEAGE_ORDER: LineageId[] = HEROES.map((h) => h.lineage.id);
