import { ARCHER } from './archer/archerHero';
import { ArcherFactory } from './archer-factory/ArcherFactory';
import type { HeroFactory } from './hero-factory/HeroFactory';
import type { HeroContent } from './interfaces/HeroContent';
import type { LineageDef } from './interfaces/LineageDef';
import type { LineageId } from './interfaces/LineageId';
import { MAGE } from './mage/mageHero';
import { MageFactory } from './mage-factory/MageFactory';
import { MERCENARY } from './mercenary/mercenaryHero';
import { MercenaryFactory } from './mercenary-factory/MercenaryFactory';
import { WARRIOR } from './warrior/warriorHero';
import { WarriorFactory } from './warrior-factory/WarriorFactory';

/**
 * Все линейки игры. Порядок списка — порядок линеек в игре (выбор класса, реестры).
 *
 * Пассивки классов (ТЗ): воин — самый большой запас здоровья, лучник — самый высокий шанс крита,
 * маг — самый большой запас ресурса и артефакты, наёмник — +20% золота.
 */
export const HEROES: readonly HeroContent[] = [WARRIOR, MAGE, ARCHER, MERCENARY];

/** Фабрики героев выпускают таланты — до переноса их в определения (этап D). */
export const HERO_FACTORIES: readonly HeroFactory[] = [
  new WarriorFactory(),
  new MageFactory(),
  new ArcherFactory(),
  new MercenaryFactory(),
];

export const LINEAGES = Object.fromEntries(HEROES.map((h) => [h.lineage.id, h.lineage])) as Record<
  LineageId,
  LineageDef
>;

export const LINEAGE_ORDER: LineageId[] = HEROES.map((h) => h.lineage.id);
