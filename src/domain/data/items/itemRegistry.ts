import { ARMORS } from '../armor/armorRegistry';
import { WEAPONS } from '../weapons/weaponRegistry';
import type { ItemDef } from './interfaces/ItemDef';

/** Всё снаряжение: сначала оружие всех линеек, затем доспехи. */
export const ITEMS: ItemDef[] = [...WEAPONS, ...ARMORS];

export const ITEM_BY_ID: Record<string, ItemDef> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
