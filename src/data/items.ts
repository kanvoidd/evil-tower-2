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
  { dmg: 1, def: 0, hp: 0, dur: 40, price: 50 },
  { dmg: 2, def: 0, hp: 0, dur: 55, price: 130 },
  { dmg: 4, def: 0, hp: 0, dur: 70, price: 340 },
  { dmg: 8, def: 0, hp: 0, dur: 85, price: 880 },
  { dmg: 15, def: 0, hp: 0, dur: 100, price: 2300 },
  { dmg: 28, def: 0, hp: 0, dur: 120, price: 6000 },
  { dmg: 50, def: 0, hp: 0, dur: 140, price: 15000 },
  { dmg: 90, def: 0, hp: 0, dur: 160, price: 40000 },
];

const ARMOR_TIERS: Tier[] = [
  { dmg: 0, def: 1, hp: 2, dur: 40, price: 60 },
  { dmg: 0, def: 2, hp: 5, dur: 55, price: 160 },
  { dmg: 0, def: 4, hp: 10, dur: 70, price: 420 },
  { dmg: 0, def: 7, hp: 20, dur: 85, price: 1100 },
  { dmg: 0, def: 12, hp: 38, dur: 100, price: 2800 },
  { dmg: 0, def: 20, hp: 70, dur: 120, price: 7200 },
  { dmg: 0, def: 33, hp: 130, dur: 140, price: 18000 },
  { dmg: 0, def: 55, hp: 240, dur: 160, price: 48000 },
];

const WEAPON_NAMES: Record<LineageId, Array<[string, string]>> = {
  warrior: [
    ['Ржавый меч', 'Rusty Sword'], ['Стальной меч', 'Steel Sword'], ['Боевой топор', 'Battle Axe'],
    ['Клеймор', 'Claymore'], ['Меч стража башни', "Tower Guard's Sword"], ['Клинок разрушителя', 'Devastator Blade'],
    ['Молот кузни', 'Forge Hammer'], ['Разлом небес', 'Skysplitter'],
  ],
  mage: [
    ['Посох ученика', 'Apprentice Staff'], ['Дубовый посох', 'Oak Staff'], ['Кристальный жезл', 'Crystal Wand'],
    ['Посох магистра', "Magister's Staff"], ['Жезл архимага', "Archmage's Rod"], ['Посох первозданной бури', 'Staff of Primal Storm'],
    ['Скипетр пепла', 'Sceptre of Ash'], ['Ось мироздания', 'Axis of Creation'],
  ],
  archer: [
    ['Короткий лук', 'Short Bow'], ['Охотничий лук', 'Hunting Bow'], ['Составной лук', 'Composite Bow'],
    ['Эльфийский лук', 'Elven Bow'], ['Лук соколиного глаза', 'Hawkeye Bow'], ['Грозовой лук', 'Stormbow'],
    ['Лук ледяных залов', 'Bow of Frozen Halls'], ['Звёздная тетива', 'Starstring'],
  ],
  mercenary: [
    ['Кинжал', 'Dagger'], ['Стилет', 'Stiletto'], ['Кривой нож', 'Kukri'],
    ['Клинки теней', 'Shadow Blades'], ['Парные кинжалы', 'Twin Daggers'], ['Лезвие ассасина', "Assassin's Edge"],
    ['Коготь пустоты', 'Void Claw'], ['Последний довод', 'Final Argument'],
  ],
};

const ARMOR_NAMES: Array<[string, string]> = [
  ['Тряпичная куртка', 'Cloth Jerkin'], ['Кожаный доспех', 'Leather Armor'], ['Кольчуга', 'Chainmail'],
  ['Латный нагрудник', 'Plate Cuirass'], ['Доспех башни', 'Tower Armor'], ['Броня титана', 'Titan Plate'],
  ['Панцирь горгульи', 'Gargoyle Carapace'], ['Доспех владыки', "Overlord's Plate"],
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
  potion_heal: { id: 'potion_heal', icon: 'item_potion_heal', price: 55, sold: true },
  potion_regen: { id: 'potion_regen', icon: 'item_potion_regen', price: 85, sold: true },
  artifact: { id: 'artifact', icon: 'item_artifact', price: 0, sold: false, lineage: 'mage' },
};

export const CONSUMABLE_SLOTS: ConsumableId[] = ['potion_heal', 'potion_regen', 'artifact'];

export const REPAIR_RATIO = 0.35;
