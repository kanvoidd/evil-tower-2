import { CLASSES } from '../data/classes';
import { LINEAGES } from '../data/heroes';
import { perkOf } from '../data/perks';
import type { ClassId, LineageId } from '../types';
import { newLineageSave, TREES } from './skillTree';
import { buildPlayerStats, type PlayerStats } from './stats';

/**
 * Краткая сводка «что даёт класс». Строится из реальных данных (характеристики, пассивка линейки,
 * стартовая способность), поэтому при правке баланса текст не расходится с игрой.
 */
export type TraitId =
  | 'mech'
  | 'artifact'
  | 'gold'
  | 'ability'
  | 'crit'
  | 'dodge'
  | 'parry'
  | 'armor'
  | 'dmg'
  | 'hp'
  | 'res';

export interface Trait {
  id: TraitId;
  /** Главное число для подстановки в текст. */
  n?: number;
  /** Название способности — переводится при выводе. */
  name?: { ru: string; en: string };
  /** Для 'mech' — линейка, механику которой описываем. */
  lineage?: LineageId;
}

/** Пороги «выдающихся» характеристик: в сводку попадает только то, чем класс действительно выделяется. */
export const TRAIT_LIMITS = { hp: 28, crit: 12, dodge: 5, parry: 1, armor: 1, dmg: 7 } as const;

/** Не больше стольких строк — чтобы сводка читалась с одного взгляда. */
export const MAX_TRAITS = 4;

/** Характеристики класса «с нуля»: база линейки и бонусы класса — без талантов и предметов. */
export const classStartStats = (classId: ClassId): PlayerStats =>
  buildPlayerStats({
    classId,
    lineage: newLineageSave(TREES[CLASSES[classId].lineage]),
    weapon: null,
    armor: null,
  });

export const classTraits = (classId: ClassId, max = MAX_TRAITS): Trait[] => {
  const cls = CLASSES[classId];
  const lin = LINEAGES[cls.lineage];
  const s = classStartStats(classId);
  const out: Trait[] = [];

  // механика линейки: у воина её нет — он просто бьёт рукой
  if (lin.id !== 'warrior') out.push({ id: 'mech', lineage: lin.id });
  if (lin.artifacts) out.push({ id: 'artifact' });
  if (lin.goldBonus > 0) out.push({ id: 'gold', n: Math.round(lin.goldBonus * 100) });

  // стартовая способность класса
  const start = perkOf(classId, 'start');
  if (start && !start.basic) out.push({ id: 'ability', name: start.name });

  // характеристики, которыми класс выделяется
  if (s.crit >= TRAIT_LIMITS.crit) out.push({ id: 'crit', n: Math.round(s.crit) });
  if (s.dodge >= TRAIT_LIMITS.dodge) out.push({ id: 'dodge', n: Math.round(s.dodge) });
  if (s.parry >= TRAIT_LIMITS.parry) out.push({ id: 'parry', n: Math.round(s.parry) });
  if (s.defense >= TRAIT_LIMITS.armor) out.push({ id: 'armor', n: s.defense });
  if (s.damage >= TRAIT_LIMITS.dmg) out.push({ id: 'dmg', n: s.damage });
  if (s.maxHp >= TRAIT_LIMITS.hp) out.push({ id: 'hp', n: s.maxHp });

  return out.slice(0, max);
};
