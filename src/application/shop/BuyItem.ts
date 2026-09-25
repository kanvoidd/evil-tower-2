import type { ItemDef } from '../../domain/data/items';
import type { ItemPurchase, Profile } from '../../domain/logic/profile';

/**
 * Купить вещь или починить надетую. Надетая целая вещь и вещь слабее надетой не продаются;
 * золото списывается только за состоявшуюся покупку или починку.
 */
export class BuyItem {
  constructor(private readonly profile: Profile) {}

  execute(item: ItemDef): ItemPurchase {
    return this.profile.buyItem(item);
  }
}
