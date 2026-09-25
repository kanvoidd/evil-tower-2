import type { ItemDef } from '../../../domain/data/items';

/** Строка снаряжения в лавке: вещь и что с ней можно сделать. */
export interface ItemOffer {
  item: ItemDef;
  /**
   * buy — купить; repair — починить надетую; equipped — надета и цела;
   * weaker — у героя уже вещь не хуже, эта не нужна.
   */
  action: 'buy' | 'repair' | 'equipped' | 'weaker';
  /** Цена покупки или починки. */
  price: number;
  /** Прочность для показа: у надетой — текущая, у остальных — полная. */
  durability: number;
  /** Хватает ли золота на покупку или починку. */
  affordable: boolean;
}
