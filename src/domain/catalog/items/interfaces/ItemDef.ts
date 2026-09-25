import type { ItemSlot, LineageId } from '../../../types';

export interface ItemDef {
  id: string;
  slot: ItemSlot;
  /** Для оружия — линейка класса, которому оно подходит. */
  lineage?: LineageId;
  tier: number;
  icon: string;
  name: { ru: string; en: string };
  damage: number;
  defense: number;
  health: number;
  durability: number;
  price: number;
}
