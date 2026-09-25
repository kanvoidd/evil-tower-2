import { Gold } from '../../shared';
import { LINEAGE_ORDER } from '../heroes/heroRegistry';
import type { ItemDef } from '../items/interfaces/ItemDef';
import type { ItemTier } from '../items/interfaces/ItemTier';

/**
 * Восемь ступеней снаряжения на десять этажей. Цена растёт медленнее силы: доход с этажа
 * умножается на FloorFactory.FLOOR_GOLD (≈1.48), поэтому и цена ступени держится в тех же пределах —
 * иначе верхние этажи упираются не в мастерство, а в кассу. Чинить вещь можно только между
 * забегами, поэтому прочности хватает на пару забегов до тех этажей, где эта ступень в ходу:
 * оружие, сломавшееся посреди забега, обрывает его вернее любого босса.
 */
const WEAPON_TIERS: ItemTier[] = [
  { dmg: 1, def: 0, hp: 0, dur: 100, price: 50 },
  { dmg: 2, def: 0, hp: 0, dur: 130, price: 130 },
  { dmg: 4, def: 0, hp: 0, dur: 170, price: 330 },
  { dmg: 8, def: 0, hp: 0, dur: 220, price: 780 },
  { dmg: 15, def: 0, hp: 0, dur: 280, price: 1800 },
  { dmg: 28, def: 0, hp: 0, dur: 350, price: 4000 },
  { dmg: 50, def: 0, hp: 0, dur: 430, price: 7200 },
  { dmg: 90, def: 0, hp: 0, dur: 520, price: 13000 },
];

/** Оружие: по восемь ступеней на каждую линейку. */
export const WEAPONS: ItemDef[] = LINEAGE_ORDER.flatMap((lineage) =>
  WEAPON_TIERS.map((t, i): ItemDef => {
    return {
      id: `w_${lineage}_${i + 1}`,
      slot: 'weapon',
      lineage,
      tier: i + 1,
      icon: `item_w_${lineage}_${i + 1}`,
      damage: t.dmg,
      defense: 0,
      health: 0,
      durability: t.dur,
      price: Gold.of(t.price),
    };
  }),
);
