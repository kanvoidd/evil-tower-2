import type { ItemDef } from '../../../domain/catalog';
import type { ItemAction } from '../../../domain/economy';

/** Строка снаряжения в лавке: вещь и что с ней можно сделать. */
export interface ItemOffer {
  item: ItemDef;
  /** Что можно сделать с вещью (`ShopRules.itemAction`). */
  action: ItemAction;
  /** Цена покупки или починки. */
  price: number;
  /** Прочность для показа: у надетой — текущая, у остальных — полная. */
  durability: number;
  /** Хватает ли золота на покупку или починку. */
  affordable: boolean;
}
