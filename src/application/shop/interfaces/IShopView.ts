import type { ConsumableDef } from '../../../domain/data/consumables';
import type { ItemDef } from '../../../domain/data/items';

/** Лавка на экране — отклик на покупки. */
export interface IShopView {
  /** Вещь куплена или починена: у героя новые характеристики, список меняется. */
  itemBought(item: ItemDef, repaired: boolean): void;
  consumableBought(): void;
  noGold(): void;
  /** Запас расходника полон — лавка больше не продаёт. */
  stackFull(def: ConsumableDef): void;
  /** Покупка не нужна: вещь надета и цела или у героя вещь не хуже. */
  denied(): void;
}
