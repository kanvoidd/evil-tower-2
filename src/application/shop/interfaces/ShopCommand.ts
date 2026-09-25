import type { ItemDef } from '../../../domain/catalog/items';
import type { ConsumableId } from '../../../domain/types';

/** Что игрок сделал в лавке. */
export type ShopCommand =
  | { type: 'buy-item'; item: ItemDef }
  | { type: 'buy-consumable'; id: ConsumableId }
  | { type: 'close' };
