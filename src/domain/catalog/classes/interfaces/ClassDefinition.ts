import type { LineageDef } from '../../heroes/interfaces/LineageDef';
import type { Stats } from '../../heroes/interfaces/Stats';
import type { PerkDef } from '../../perks/interfaces/PerkDef';
import type { TalentPlace } from '../../talents/interfaces/TalentPlace';
import type { ClassId } from './ClassId';

/**
 * Определение класса — что класс даёт любому герою, который им станет. Это данные, а не герой:
 * сам герой (`Hero`) один на линейку и переходит из класса в класс метаморфозой.
 */
export interface ClassDefinition {
  readonly id: ClassId;
  /** Линейка: ресурс, стиль боя, пассивки. */
  readonly lineage: LineageDef;
  /** 0 — базовый; дальше — ступени (`ClassDef.stage`). */
  readonly stage: 0 | 1 | 2;
  /** Из каких классов ведёт метаморфоза в этот. */
  readonly parents: readonly ClassId[];
  /** База линейки плюс бонусы класса — характеристики до талантов и снаряжения. */
  readonly baseStats: Readonly<Stats>;
  /** Перки класса: по слотам ярусов или по шагам веток. */
  readonly abilities: readonly PerkDef[];
  /** Таланты класса на своих местах (без дерева «Основа» линейки). */
  readonly talents: readonly TalentPlace[];
  /** Классы, в которые ведёт метаморфоза (у финальных — никуда). */
  readonly next: readonly ClassId[];
}
