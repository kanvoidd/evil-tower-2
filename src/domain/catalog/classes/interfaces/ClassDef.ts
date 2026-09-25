import type { AbilityDef } from '../../abilities/interfaces/AbilityDef';
import type { LineageId } from '../../heroes/interfaces/LineageId';
import type { Stats } from '../../heroes/interfaces/Stats';
import type { PerkSlot } from '../../perks/interfaces/PerkSlot';
import type { ClassId } from './ClassId';

/** Определение класса: файл `heroes/<линейка>/classes/<класс>.ts`. */
export interface ClassDef {
  readonly id: ClassId;
  readonly lineage: LineageId;
  /** 0 — базовый, 1 — вторая ступень, 2 — финальный (раздвоение). */
  readonly stage: 0 | 1 | 2;
  /** Из какого класса ведёт метаморфоза в этот (у базового — ни из какого). */
  readonly parent: ClassId | null;
  /** Прибавки класса к базовым характеристикам линейки. */
  readonly bonuses: Partial<Stats>;
  /**
   * Перки — какие способности класс выдаёт на местах дерева: стартовая (бесплатно вместе с
   * классом), вторая, третья и легендарная (только у финальных классов).
   */
  readonly perks: Readonly<Partial<Record<PerkSlot, AbilityDef>>>;
}
