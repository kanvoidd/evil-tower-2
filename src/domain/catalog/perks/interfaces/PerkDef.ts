import type { AbilityDef } from '../../abilities/interfaces/AbilityDef';
import type { ClassId } from '../../classes/interfaces/ClassId';
import type { PerkSlot } from './PerkSlot';

/**
 * Перк — выдача способности классу на месте в дереве прокачки. Реестр выводит перки из
 * `ClassDef.perks`; что способность делает и сколько стоит — в ней самой (`AbilityDef`).
 */
export interface PerkDef {
  /** `<класс>_<слот>` — место в дереве; узел дерева — `perk/<класс>/<слот>`. */
  readonly id: string;
  readonly classId: ClassId;
  readonly slot: PerkSlot;
  readonly ability: AbilityDef;
}
