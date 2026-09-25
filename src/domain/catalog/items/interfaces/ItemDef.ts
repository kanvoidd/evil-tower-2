import type { Gold } from '../../../shared';
import type { LineageId } from '../../heroes/interfaces/LineageId';
import type { ItemSlot } from './ItemSlot';

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
  price: Gold;
}
