import type { LineageDef } from '../../heroes/interfaces/LineageDef';
import type { Stats } from '../../heroes/interfaces/Stats';
import type { PerkDef } from '../../perks/interfaces/PerkDef';
import type { TalentDef } from '../../talents/interfaces/TalentDef';
import type { ClassId } from './ClassId';

/**
 * Определение класса — что класс даёт любому герою, который им станет. Это данные, а не герой:
 * сам герой (`Hero`) один на линейку и переходит из класса в класс метаморфозой.
 */
export interface ClassDefinition {
  readonly id: ClassId;
  /** Линейка: ресурс, стиль боя, пассивки. */
  readonly lineage: LineageDef;
  /** 0 — базовый, 1 — вторая ступень, 2 — финальный (раздвоение). */
  readonly stage: 0 | 1 | 2;
  readonly parent: ClassId | null;
  /** База линейки плюс бонусы класса — характеристики до талантов и снаряжения. */
  readonly baseStats: Readonly<Stats>;
  /** Способности класса по слотам: стартовая, вторая, третья, легендарная. */
  readonly abilities: readonly PerkDef[];
  /** Таланты дерева класса. */
  readonly talents: readonly TalentDef[];
  /** Классы, в которые ведёт метаморфоза (у финальных — никуда). */
  readonly next: readonly ClassId[];
}
