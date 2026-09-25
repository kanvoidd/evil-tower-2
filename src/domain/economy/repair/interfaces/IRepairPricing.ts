import type { EquipmentSave, ItemDef } from '../../../catalog';
import type { Gold } from '../../../shared';

/** Цена починки вещи. */
export interface IRepairPricing {
  /** Сколько стоит вернуть надетой вещи полную прочность; не надетая — ноль. */
  repairCost(item: ItemDef, worn: EquipmentSave | null): Gold;
}
