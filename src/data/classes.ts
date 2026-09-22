import type { ClassId, LineageId, ResourceKind, Stats } from '../types';

export interface LineageDef {
  id: LineageId;
  resource: ResourceKind;
  /** Базовые характеристики до прокачки. */
  base: Stats;
  resMax: number;
  resRegen: number;
  /**
   * Пассивное умение линейки (в дополнение к «выдающейся» характеристике):
   * наёмник берёт больше золота, маг подбирает артефакты.
   */
  goldBonus: number;
  artifacts: boolean;
  /**
   * Может ли герой бить рукой по нажатию на соседнего врага.
   * У линейки мага — нет: он вообще не бьёт обычным ударом, только заклинаниями по кнопке.
   */
  melee: boolean;
}

/**
 * Пассивки классов (ТЗ): воин — самый большой запас здоровья, лучник — самый высокий шанс крита,
 * маг — самый большой запас ресурса и артефакты, наёмник — +20% золота.
 */
export const LINEAGES: Record<LineageId, LineageDef> = {
  warrior: {
    id: 'warrior',
    resource: 'stamina',
    base: { damage: 3, crit: 5, health: 30, dodge: 0, defense: 1, parry: 0, luck: 0 },
    resMax: 10, resRegen: 1, goldBonus: 0, artifacts: false, melee: true,
  },
  mage: {
    id: 'mage',
    resource: 'mana',
    base: { damage: 5, crit: 5, health: 18, dodge: 0, defense: 0, parry: 0, luck: 1 },
    resMax: 14, resRegen: 3, goldBonus: 0, artifacts: true, melee: false,
  },
  archer: {
    id: 'archer',
    resource: 'concentration',
    base: { damage: 3, crit: 18, health: 22, dodge: 4, defense: 0, parry: 0, luck: 0 },
    resMax: 7, resRegen: 2, goldBonus: 0, artifacts: false, melee: true,
  },
  mercenary: {
    id: 'mercenary',
    resource: 'vigilance',
    base: { damage: 3, crit: 10, health: 22, dodge: 5, defense: 0, parry: 0, luck: 0 },
    resMax: 7, resRegen: 2, goldBonus: 0.2, artifacts: false, melee: true,
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
  knight: c('knight', 'warrior', 1, 'warrior', { health: 10, defense: 2 }),
  berserk: c('berserk', 'warrior', 2, 'knight', { damage: 4, crit: 5, health: 6 }),
  paladin: c('paladin', 'warrior', 2, 'knight', { defense: 3, health: 12, parry: 5 }),

  mage: c('mage', 'mage', 0, null),
  magister: c('magister', 'mage', 1, 'mage', { damage: 3, health: 5 }),
  necromancer: c('necromancer', 'mage', 2, 'magister', { damage: 4, health: 6, luck: 1 }),
  pyromancer: c('pyromancer', 'mage', 2, 'magister', { damage: 6, crit: 5 }),

  archer: c('archer', 'archer', 0, null),
  hawkeye: c('hawkeye', 'archer', 1, 'archer', { crit: 6, damage: 2, health: 3 }),
  arrowgod: c('arrowgod', 'archer', 2, 'hawkeye', { damage: 4, crit: 8 }),
  sniper: c('sniper', 'archer', 2, 'hawkeye', { damage: 6, dodge: 3 }),

  mercenary: c('mercenary', 'mercenary', 0, null),
  assassin: c('assassin', 'mercenary', 1, 'mercenary', { crit: 8, dodge: 5, health: 3 }),
  darkassassin: c('darkassassin', 'mercenary', 2, 'assassin', { damage: 4, crit: 10 }),
  ninja: c('ninja', 'mercenary', 2, 'assassin', { dodge: 12, damage: 3 }),
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

/** Классы линейки в порядке развития: базовый, второй, два финальных. */
export const classesOfLineage = (l: LineageId): ClassId[] =>
  CLASS_ORDER.filter((id) => CLASSES[id].lineage === l);

export const terminalsOf = (l: LineageId): ClassId[] =>
  classesOfLineage(l).filter((id) => CLASSES[id].stage === 2);

export const secondOf = (l: LineageId): ClassId =>
  classesOfLineage(l).find((id) => CLASSES[id].stage === 1)!;
