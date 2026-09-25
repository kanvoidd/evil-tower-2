import type { ConsumableDef } from './interfaces/ConsumableDef';
import type { ConsumableId } from './interfaces/ConsumableId';

export const CONSUMABLES: Record<ConsumableId, ConsumableDef> = {
  potion_heal: { id: 'potion_heal', icon: 'item_potion_heal', price: 55, sold: true, max: 5 },
  potion_regen: { id: 'potion_regen', icon: 'item_potion_regen', price: 85, sold: true, max: 3 },
  artifact: { id: 'artifact', icon: 'item_artifact', price: 0, sold: false, lineage: 'mage' },
};

export const CONSUMABLE_SLOTS: ConsumableId[] = ['potion_heal', 'potion_regen', 'artifact'];
