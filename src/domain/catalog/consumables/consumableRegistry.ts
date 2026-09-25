import { Gold } from '../../shared';
import type { ConsumableDef } from './interfaces/ConsumableDef';
import type { ConsumableId } from './interfaces/ConsumableId';

export const CONSUMABLES: Record<ConsumableId, ConsumableDef> = {
  potion_heal: {
    id: 'potion_heal',
    icon: 'item_potion_heal',
    price: Gold.of(55),
    sold: true,
    max: 5,
  },
  potion_regen: {
    id: 'potion_regen',
    icon: 'item_potion_regen',
    price: Gold.of(85),
    sold: true,
    max: 3,
  },
  artifact: {
    id: 'artifact',
    icon: 'item_artifact',
    price: Gold.of(0),
    sold: false,
    lineage: 'mage',
  },
};

export const CONSUMABLE_SLOTS: ConsumableId[] = ['potion_heal', 'potion_regen', 'artifact'];
