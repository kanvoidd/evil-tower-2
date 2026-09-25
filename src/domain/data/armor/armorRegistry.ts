import type { ItemDef } from '../items/interfaces/ItemDef';
import type { ItemTier } from '../items/interfaces/ItemTier';

/** Ступени доспехов: общие для всех линеек. */
const ARMOR_TIERS: ItemTier[] = [
  { dmg: 0, def: 1, hp: 2, dur: 100, price: 60 },
  { dmg: 0, def: 2, hp: 5, dur: 130, price: 155 },
  { dmg: 0, def: 4, hp: 10, dur: 170, price: 390 },
  { dmg: 0, def: 7, hp: 20, dur: 220, price: 930 },
  { dmg: 0, def: 12, hp: 38, dur: 280, price: 2150 },
  { dmg: 0, def: 20, hp: 70, dur: 350, price: 4800 },
  { dmg: 0, def: 33, hp: 130, dur: 430, price: 8700 },
  { dmg: 0, def: 55, hp: 240, dur: 520, price: 15500 },
];

const ARMOR_NAMES: Array<[string, string]> = [
  ['Тряпичная куртка', 'Cloth Jerkin'], ['Кожаный доспех', 'Leather Armor'], ['Кольчуга', 'Chainmail'],
  ['Латный нагрудник', 'Plate Cuirass'], ['Доспех башни', 'Tower Armor'], ['Броня титана', 'Titan Plate'],
  ['Панцирь горгульи', 'Gargoyle Carapace'], ['Доспех владыки', "Overlord's Plate"],
];

/** Доспехи: восемь ступеней, одни на все линейки. */
export const ARMORS: ItemDef[] = ARMOR_NAMES.map(([ru, en], i): ItemDef => {
  const t = ARMOR_TIERS[i];
  return {
    id: `a_${i + 1}`, slot: 'armor', tier: i + 1, icon: `item_a_${i + 1}`,
    name: { ru, en }, damage: 0, defense: t.def, health: t.hp, durability: t.dur, price: t.price,
  };
});
