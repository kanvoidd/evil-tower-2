import type { AbilityDef } from '../../abilities/interfaces/AbilityDef';
import type { ClassId } from '../../classes/interfaces/ClassId';
import type { PerkSlot } from './PerkSlot';

/**
 * Перк — выдача способности классу на месте в дереве прокачки. Реестр выводит перки из классов
 * (`ClassDef.perks` у классов с ярусами, шаги веток у классов с ветками); что способность делает,
 * сколько стоит и сколько у неё уровней — в ней самой (`AbilityDef`).
 */
export interface PerkDef {
  /** `<класс>_<слот>` — место в дереве; узел дерева — `perk/<класс>/<слот>`. */
  readonly id: string;
  readonly classId: ClassId;
  readonly slot: PerkSlot;
  readonly ability: AbilityDef;
  /** Ветка класса, в которой стоит перк (у классов с ярусами — нет). */
  readonly branch?: string;
  /** Номер шага в ветке, с нуля. */
  readonly step?: number;
}
