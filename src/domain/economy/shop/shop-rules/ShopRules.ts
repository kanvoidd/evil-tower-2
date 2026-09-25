import {
  type ConsumableDef,
  type EquipmentSave,
  ITEM_BY_ID,
  type ItemDef,
  ITEMS,
  type ItemSlot,
  type LineageId,
} from '../../../catalog';
import type { ItemAction } from '../interfaces/ItemAction';

/** Правила лавки: что она продаёт герою, что можно сделать с вещью, сколько расходников взять. */
export class ShopRules {
  /** Товар слота: оружие — только линейки героя, броня — любая; по ступеням. */
  static stock(slot: ItemSlot, lineage: LineageId): ItemDef[] {
    return ITEMS.filter((i) => i.slot === slot && (i.slot === 'armor' || i.lineage === lineage));
  }

  /** Что можно сделать с вещью при надетой `worn` того же слота. */
  static itemAction(item: ItemDef, worn: EquipmentSave | null): ItemAction {
    if (worn && worn.id === item.id)
      return worn.durability >= item.durability ? 'equipped' : 'repair';
    if (worn && ITEM_BY_ID[worn.id].tier >= item.tier) return 'weaker';
    return 'buy';
  }

  /** Следующая ступень оружия линейки и брони после надетых. */
  static nextTiers(
    lineage: LineageId,
    weapon: EquipmentSave | null,
    armor: EquipmentSave | null,
  ): ItemDef[] {
    const wt = weapon ? ITEM_BY_ID[weapon.id].tier : 0;
    const at = armor ? ITEM_BY_ID[armor.id].tier : 0;
    return ITEMS.filter((i) =>
      i.slot === 'weapon' ? i.lineage === lineage && i.tier === wt + 1 : i.tier === at + 1,
    );
  }

  /** Запас расходника полон — больше лавка не продаёт. */
  static stockFull(def: ConsumableDef, owned: number): boolean {
    return def.max !== undefined && owned >= def.max;
  }

  /** Можно ли взять ещё `count` штук, не превысив предел запаса. */
  static canStock(def: ConsumableDef, owned: number, count: number): boolean {
    return def.max === undefined || owned + count <= def.max;
  }
}
