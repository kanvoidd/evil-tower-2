import type { EquipmentSave, ItemDef } from '../../../catalog';
import { Gold, type Ratio } from '../../../shared';
import type { IRepairPricing } from '../interfaces/IRepairPricing';

/** Починка стоит долю цены вещи, пропорциональную её износу; копейки округляются вверх. */
export class PriceShareRepair implements IRepairPricing {
  constructor(private readonly share: Ratio) {}

  repairCost(item: ItemDef, worn: EquipmentSave | null): Gold {
    if (!worn || worn.id !== item.id) return Gold.of(0);
    const missing = 1 - worn.durability / item.durability;
    return Gold.of(Math.ceil(item.price * this.share * missing));
  }
}
