import type { ConsumableId, ItemSlot, LineageId } from '../types';

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

interface Tier {
  dmg: number;
  def: number;
  hp: number;
  dur: number;
  price: number;
}

const WEAPON_TIERS: Tier[] = [
  { dmg: 1, def: 0, hp: 0, dur: 30, price: 50 },
  { dmg: 2, def: 0, hp: 0, dur: 40, price: 150 },
  { dmg: 4, def: 0, hp: 0, dur: 50, price: 400 },
  { dmg: 6, def: 0, hp: 0, dur: 60, price: 900 },
  { dmg: 9, def: 0, hp: 0, dur: 70, price: 2000 },
  { dmg: 13, def: 0, hp: 0, dur: 80, price: 4500 },
];

const ARMOR_TIERS: Tier[] = [
  { dmg: 0, def: 1, hp: 0, dur: 30, price: 60 },
  { dmg: 0, def: 2, hp: 2, dur: 40, price: 180 },
  { dmg: 0, def: 3, hp: 4, dur: 50, price: 450 },
  { dmg: 0, def: 5, hp: 6, dur: 60, price: 1000 },
  { dmg: 0, def: 7, hp: 10, dur: 70, price: 2200 },
  { dmg: 0, def: 10, hp: 15, dur: 80, price: 5000 },
];

const WEAPON_NAMES: Record<LineageId, Array<[string, string]>> = {
  warrior: [
    ['Ржавый меч', 'Rusty Sword'], ['Стальной меч', 'Steel Sword'], ['Боевой топор', 'Battle Axe'],
    ['Клеймор', 'Claymore'], ['Меч стража башни', "Tower Guard's Sword"], ['Клинок разрушителя', 'Devastator Blade'],
  ],
  mage: [
    ['Посох ученика', 'Apprentice Staff'], ['Дубовый посох', 'Oak Staff'], ['Кристальный жезл', 'Crystal Wand'],
    ['Посох магистра', "Magister's Staff"], ['Жезл архимага', "Archmage's Rod"], ['Посох первозданной бури', 'Staff of Primal Storm'],
  ],
  archer: [
    ['Короткий лук', 'Short Bow'], ['Охотничий лук', 'Hunting Bow'], ['Составной лук', 'Composite Bow'],
    ['Эльфийский лук', 'Elven Bow'], ['Лук соколиного глаза', 'Hawkeye Bow'], ['Грозовой лук', 'Stormbow'],
  ],
  mercenary: [
    ['Кинжал', 'Dagger'], ['Стилет', 'Stiletto'], ['Кривой нож', 'Kukri'],
    ['Клинки теней', 'Shadow Blades'], ['Парные кинжалы', 'Twin Daggers'], ['Лезвие ассасина', "Assassin's Edge"],
  ],
};

const ARMOR_NAMES: Array<[string, string]> = [
  ['Тряпичная куртка', 'Cloth Jerkin'], ['Кожаный доспех', 'Leather Armor'], ['Кольчуга', 'Chainmail'],
  ['Латный нагрудник', 'Plate Cuirass'], ['Доспех башни', 'Tower Armor'], ['Броня титана', 'Titan Plate'],
];

export const ITEMS: ItemDef[] = [];

(Object.keys(WEAPON_NAMES) as LineageId[]).forEach((lineage) => {
  WEAPON_NAMES[lineage].forEach(([ru, en], i) => {
    const t = WEAPON_TIERS[i];
    ITEMS.push({
      id: `w_${lineage}_${i + 1}`, slot: 'weapon', lineage, tier: i + 1, icon: `item_w_${lineage}_${i + 1}`,
      name: { ru, en }, damage: t.dmg, defense: 0, health: 0, durability: t.dur, price: t.price,
    });
  });
});

ARMOR_NAMES.forEach(([ru, en], i) => {
  const t = ARMOR_TIERS[i];
  ITEMS.push({
    id: `a_${i + 1}`, slot: 'armor', tier: i + 1, icon: `item_a_${i + 1}`,
    name: { ru, en }, damage: 0, defense: t.def, health: t.hp, durability: t.dur, price: t.price,
  });
});

export const ITEM_BY_ID: Record<string, ItemDef> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export interface ConsumableDef {
  id: ConsumableId;
  icon: string;
  price: number;
  /** Можно ли купить в лавке (артефакты только из сундуков). */
  sold: boolean;
  /** Ограничение по линейке (артефакт — только маг). */
  lineage?: LineageId;
}

export const CONSUMABLES: Record<ConsumableId, ConsumableDef> = {
  potion_heal: { id: 'potion_heal', icon: 'item_potion_heal', price: 40, sold: true },
  potion_regen: { id: 'potion_regen', icon: 'item_potion_regen', price: 60, sold: true },
  artifact: { id: 'artifact', icon: 'item_artifact', price: 0, sold: false, lineage: 'mage' },
};

export const CONSUMABLE_SLOTS: ConsumableId[] = ['potion_heal', 'potion_regen', 'artifact'];

export const REPAIR_RATIO = 0.5;
