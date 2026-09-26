import type { AbilityDef } from '../../abilities/interfaces/AbilityDef';
import type { LineageId } from '../../heroes/interfaces/LineageId';
import type { Stats } from '../../heroes/interfaces/Stats';
import type { TieredPerkSlot } from '../../perks/interfaces/PerkSlot';
import type { TalentTree } from '../../talents/interfaces/TalentTree';
import type { BranchDef } from './BranchDef';
import type { ClassId } from './ClassId';

/** Общее у любого класса: линейка, ступень, откуда в него ведёт метаморфоза, прибавки. */
interface ClassDefCommon {
  readonly id: ClassId;
  readonly lineage: LineageId;
  /**
   * 0 — базовый. У классов с ярусами 1 — вторая ступень, 2 — финальный (раздвоение); у классов
   * с ветками 1 — подкласс (выбор одного из нескольких), 2 — переходный класс.
   */
  readonly stage: 0 | 1 | 2;
  /** Из каких классов ведёт метаморфоза в этот (у базового — ни из какого; у переходного — из любого подкласса). */
  readonly parents: readonly ClassId[];
  /** Прибавки класса к базовым характеристикам линейки. */
  readonly bonuses: Partial<Stats>;
}

/**
 * Класс с ярусами талантов и перками между ними (воин, наёмник): файл
 * `heroes/<линейка>/classes/<класс>.ts`.
 */
export interface TieredClassDef extends ClassDefCommon {
  /**
   * Перки — какие способности класс выдаёт на местах дерева: стартовая (бесплатно вместе с
   * классом), вторая, третья и легендарная (только у финальных классов).
   */
  readonly perks: Readonly<Partial<Record<TieredPerkSlot, AbilityDef>>>;
  /** Дерево талантов класса — `heroes/<линейка>/talents/<класс>.ts`. */
  readonly talents: TalentTree;
}

/**
 * Класс профессионального развития (маг, лучник): ветки перков и талантов. Общие характеристики
 * героя растут в дереве «Основа» линейки (`HeroContent.baseTree`), а не здесь.
 */
export interface BranchedClassDef extends ClassDefCommon {
  readonly branches: readonly BranchDef[];
  /** `one` — развивать можно только одну ветку (стихия элементалиста), `all` — любые. */
  readonly branchChoice: 'one' | 'all';
}

/** Определение класса. */
export type ClassDef = TieredClassDef | BranchedClassDef;
