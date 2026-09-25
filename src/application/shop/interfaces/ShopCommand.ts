import type { ConsumableId, ItemDef } from '../../../domain/catalog';

/** Что игрок сделал в лавке. */
export type ShopCommand =
  | { type: 'buy-item'; item: ItemDef }
  | { type: 'buy-consumable'; id: ConsumableId }
  | { type: 'close' };
