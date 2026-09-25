import { ArcherFactory } from './archer-factory/ArcherFactory';
import type { HeroFactory } from './hero-factory/HeroFactory';
import type { LineageDef } from './interfaces/LineageDef';
import type { LineageId } from './interfaces/LineageId';
import { MageFactory } from './mage-factory/MageFactory';
import { MercenaryFactory } from './mercenary-factory/MercenaryFactory';
import { WarriorFactory } from './warrior-factory/WarriorFactory';

/**
 * Все конкретные фабрики героев. Порядок списка — порядок линеек в игре (выбор класса, реестры).
 */
export const HERO_FACTORIES: readonly HeroFactory[] = [
  new WarriorFactory(),
  new MageFactory(),
  new ArcherFactory(),
  new MercenaryFactory(),
];

/**
 * Пассивки классов (ТЗ): воин — самый большой запас здоровья, лучник — самый высокий шанс крита,
 * маг — самый большой запас ресурса и артефакты, наёмник — +20% золота.
 *
 * Линейки и классы выпускают фабрики героев (src/domain/catalog/heroes) — здесь только реестр.
 */
export const LINEAGES = Object.fromEntries(
  HERO_FACTORIES.map((f) => [f.lineage, f.createLineage()]),
) as Record<LineageId, LineageDef>;

export const LINEAGE_ORDER: LineageId[] = HERO_FACTORIES.map((f) => f.lineage);
