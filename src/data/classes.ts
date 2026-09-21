import type { ClassId, LineageId, ResourceKind, Stats } from '../types';

export interface LineageDef {
  id: LineageId;
  resource: ResourceKind;
  /** Базовые характеристики до прокачки. */
  base: Stats;
  resMax: number;
  resRegen: number;
  /** Цена атаки в ресурсе (у мага — каждая атака расходует ману). */
  attackCost: number;
  /** Цена дальней атаки (лучник — выстрел «через одну», наёмник — телепорт за спину любого врага с гарантированным критом). */
  rangedCost: number;
  ranged: 'none' | 'skip' | 'any';
  /** Множитель урона, когда ресурс есть (маг) / нет (слабый удар). */
  spellMul: number;
}

export const LINEAGES: Record<LineageId, LineageDef> = {
  warrior: {
    id: 'warrior',
    resource: 'stamina',
    base: { damage: 3, crit: 5, health: 24, dodge: 0, defense: 0, parry: 0, luck: 0 },
    resMax: 10, resRegen: 1, attackCost: 0, rangedCost: 0, ranged: 'none', spellMul: 1,
  },
  mage: {
    id: 'mage',
    resource: 'mana',
    base: { damage: 4, crit: 5, health: 16, dodge: 0, defense: 0, parry: 0, luck: 0 },
    resMax: 10, resRegen: 1, attackCost: 2, rangedCost: 0, ranged: 'none', spellMul: 1.5,
  },
  archer: {
    id: 'archer',
    resource: 'concentration',
    base: { damage: 3, crit: 8, health: 18, dodge: 3, defense: 0, parry: 0, luck: 0 },
    resMax: 6, resRegen: 1, attackCost: 0, rangedCost: 2, ranged: 'skip', spellMul: 1,
  },
  mercenary: {
    id: 'mercenary',
    resource: 'vigilance',
    base: { damage: 3, crit: 8, health: 18, dodge: 4, defense: 0, parry: 0, luck: 0 },
    // Наёмник: за 6 осмотрительности телепортируется за спину любого врага и бьёт критом со 100% шансом.
    resMax: 6, resRegen: 1, attackCost: 0, rangedCost: 6, ranged: 'any', spellMul: 1,
  },
};

export interface ClassDef {
  id: ClassId;
  lineage: LineageId;
  /** 0 — базовый, 1 — вторая ступень, 2 — финальный (раздвоение). */
  stage: 0 | 1 | 2;
  parent: ClassId | null;
  /** Аддитивные бонусы класса к базовым характеристикам. */
  mods: Partial<Stats>;
}

const c = (
  id: ClassId, lineage: LineageId, stage: 0 | 1 | 2, parent: ClassId | null, mods: Partial<Stats> = {},
): ClassDef => ({ id, lineage, stage, parent, mods });

export const CLASSES: Record<ClassId, ClassDef> = {
  warrior: c('warrior', 'warrior', 0, null),
  knight: c('knight', 'warrior', 1, 'warrior', { health: 6, defense: 1 }),
  berserk: c('berserk', 'warrior', 2, 'knight', { damage: 3, crit: 5, health: 4 }),
  paladin: c('paladin', 'warrior', 2, 'knight', { defense: 2, health: 8, parry: 5 }),

  mage: c('mage', 'mage', 0, null),
  magister: c('magister', 'mage', 1, 'mage', { damage: 2, health: 3 }),
  necromancer: c('necromancer', 'mage', 2, 'magister', { damage: 3, health: 4, luck: 1 }),
  pyromancer: c('pyromancer', 'mage', 2, 'magister', { damage: 4, crit: 5 }),

  archer: c('archer', 'archer', 0, null),
  hawkeye: c('hawkeye', 'archer', 1, 'archer', { crit: 5, damage: 1 }),
  arrowgod: c('arrowgod', 'archer', 2, 'hawkeye', { damage: 3, crit: 8 }),
  sniper: c('sniper', 'archer', 2, 'hawkeye', { damage: 5, dodge: 3 }),

  mercenary: c('mercenary', 'mercenary', 0, null),
  assassin: c('assassin', 'mercenary', 1, 'mercenary', { crit: 8, dodge: 5 }),
  darkassassin: c('darkassassin', 'mercenary', 2, 'assassin', { damage: 3, crit: 10 }),
  ninja: c('ninja', 'mercenary', 2, 'assassin', { dodge: 12, damage: 2 }),
};

export const LINEAGE_ORDER: LineageId[] = ['warrior', 'mage', 'archer', 'mercenary'];

export const CLASS_ORDER: ClassId[] = [
  'warrior', 'knight', 'berserk', 'paladin',
  'mage', 'magister', 'necromancer', 'pyromancer',
  'archer', 'hawkeye', 'arrowgod', 'sniper',
  'mercenary', 'assassin', 'darkassassin', 'ninja',
];

export const lineageOf = (id: ClassId): LineageId => CLASSES[id].lineage;
export const baseClassOf = (l: LineageId): ClassId => l;
