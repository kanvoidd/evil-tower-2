import type { LineageId } from '../heroes/interfaces/LineageId';
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

const WEAPON_NAMES: Record<LineageId, Array<[string, string]>> = {
  warrior: [
    ['Ржавый меч', 'Rusty Sword'],
    ['Стальной меч', 'Steel Sword'],
    ['Боевой топор', 'Battle Axe'],
    ['Клеймор', 'Claymore'],
    ['Меч стража башни', "Tower Guard's Sword"],
    ['Клинок разрушителя', 'Devastator Blade'],
    ['Молот кузни', 'Forge Hammer'],
    ['Разлом небес', 'Skysplitter'],
  ],
  mage: [
    ['Посох ученика', 'Apprentice Staff'],
    ['Дубовый посох', 'Oak Staff'],
    ['Кристальный жезл', 'Crystal Wand'],
    ['Посох магистра', "Magister's Staff"],
    ['Жезл архимага', "Archmage's Rod"],
    ['Посох первозданной бури', 'Staff of Primal Storm'],
    ['Скипетр пепла', 'Sceptre of Ash'],
    ['Ось мироздания', 'Axis of Creation'],
  ],
  archer: [
    ['Короткий лук', 'Short Bow'],
    ['Охотничий лук', 'Hunting Bow'],
    ['Составной лук', 'Composite Bow'],
    ['Эльфийский лук', 'Elven Bow'],
    ['Лук соколиного глаза', 'Hawkeye Bow'],
    ['Грозовой лук', 'Stormbow'],
    ['Лук ледяных залов', 'Bow of Frozen Halls'],
    ['Звёздная тетива', 'Starstring'],
  ],
  mercenary: [
    ['Кинжал', 'Dagger'],
    ['Стилет', 'Stiletto'],
    ['Кривой нож', 'Kukri'],
    ['Клинки теней', 'Shadow Blades'],
    ['Парные кинжалы', 'Twin Daggers'],
    ['Лезвие ассасина', "Assassin's Edge"],
    ['Коготь пустоты', 'Void Claw'],
    ['Последний довод', 'Final Argument'],
  ],
};

/** Оружие: по восемь ступеней на каждую линейку. */
export const WEAPONS: ItemDef[] = (Object.keys(WEAPON_NAMES) as LineageId[]).flatMap((lineage) =>
  WEAPON_NAMES[lineage].map(([ru, en], i): ItemDef => {
    const t = WEAPON_TIERS[i];
    return {
      id: `w_${lineage}_${i + 1}`,
      slot: 'weapon',
      lineage,
      tier: i + 1,
      icon: `item_w_${lineage}_${i + 1}`,
      name: { ru, en },
      damage: t.dmg,
      defense: 0,
      health: 0,
      durability: t.dur,
      price: t.price,
    };
  }),
);
