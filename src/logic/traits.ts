import type { ClassId, LineageId } from '../types';
import { CLASSES, LINEAGES } from '../data/classes';
import { PERK_BY_ID, perkId } from '../data/perks';
import { newLineageSave, TREES } from './skillTree';
import { buildPlayerStats, type PlayerStats } from './stats';

/**
 * Краткая сводка «что даёт класс». Строится из реальных данных (характеристики класса, его стартовый перк,
 * механика линейки), поэтому при правке баланса текст не расходится с игрой.
 */
export type TraitId =
  | 'mech' | 'artifact' | 'backstab'
  | 'burst' | 'shield' | 'attackCost' | 'soul' | 'splash' | 'rangedCost' | 'rangedMul' | 'execute' | 'gold' | 'critMul'
  | 'crit' | 'dodge' | 'parry' | 'armor' | 'dmg' | 'luck' | 'hp';

export interface Trait {
  id: TraitId;
  /** Главное число для подстановки в текст. */
  n?: number;
  /** Второе число (цена мощного удара). */
  m?: number;
  /** Для 'mech' — линейка, механику которой описываем. */
  lineage?: LineageId;
}

/** Пороги «выдающихся» характеристик: чтобы в сводку попадало только то, чем класс действительно выделяется. */
export const TRAIT_LIMITS = { hp: 24, crit: 10, dodge: 5, parry: 1, armor: 1, dmg: 7, luck: 1 } as const;

/** Не больше стольких строк — чтобы сводка читалась с одного взгляда. */
export const MAX_TRAITS = 4;

/** Характеристики класса «с нуля»: база линейки, бонусы класса и стартовый перк — без прокачки и предметов. */
export const classStartStats = (classId: ClassId): PlayerStats =>
  buildPlayerStats({ classId, lineage: newLineageSave(TREES[CLASSES[classId].lineage]), weapon: null, armor: null });

export const classTraits = (classId: ClassId, max = MAX_TRAITS): Trait[] => {
  const cls = CLASSES[classId];
  const lin = LINEAGES[cls.lineage];
  const s = classStartStats(classId);
  const out: Trait[] = [];

  // Механика линейки. У воина отдельной строки нет: его особенности — мощный удар и здоровье.
  if (lin.id !== 'warrior') out.push({ id: 'mech', lineage: lin.id });
  if (lin.id === 'mage') out.push({ id: 'artifact' });
  if (lin.id === 'mercenary') out.push({ id: 'backstab', n: s.rangedCost });

  // особенности стартового (бесплатного) перка
  const start = PERK_BY_ID[perkId(classId, 'start')];
  for (const fx of start?.effects ?? []) {
    switch (fx.type) {
      case 'burst': out.push({ id: 'burst', n: Math.round(fx.mul * 100), m: fx.cost }); break;
      case 'startShield': out.push({ id: 'shield', n: fx.amount }); break;
      case 'soulBonus': out.push({ id: 'soul', n: Math.round(fx.ratio * 100) }); break;
      case 'splash': out.push({ id: 'splash', n: Math.round(fx.ratio * 100) }); break;
      case 'rangedCost': if (fx.add < 0) out.push({ id: 'rangedCost', n: -fx.add }); break;
      case 'rangedMul': out.push({ id: 'rangedMul', n: Math.round(fx.ratio * 100) }); break;
      case 'execute': out.push({ id: 'execute', n: Math.round(fx.ratio * 100) }); break;
      case 'goldBonus': out.push({ id: 'gold', n: Math.round(fx.ratio * 100) }); break;
      case 'critMul': out.push({ id: 'critMul', n: Math.round(fx.add * 100) }); break;
      case 'stat':
        // «Больше маны/ресурса» в сводку не выносим — это мелочь, а не суть класса
        if (fx.stat === 'attackCost' && fx.add < 0) out.push({ id: 'attackCost', n: -fx.add });
        break;
      default: break;
    }
  }

  // характеристики, которыми класс выделяется
  if (s.crit >= TRAIT_LIMITS.crit) out.push({ id: 'crit', n: Math.round(s.crit) });
  if (s.dodge >= TRAIT_LIMITS.dodge) out.push({ id: 'dodge', n: Math.round(s.dodge) });
  if (s.parry >= TRAIT_LIMITS.parry) out.push({ id: 'parry', n: Math.round(s.parry) });
  if (s.defense >= TRAIT_LIMITS.armor) out.push({ id: 'armor', n: s.defense });
  if (s.damage >= TRAIT_LIMITS.dmg) out.push({ id: 'dmg', n: s.damage });
  if (s.luck >= TRAIT_LIMITS.luck) out.push({ id: 'luck' });
  if (s.maxHp >= TRAIT_LIMITS.hp) out.push({ id: 'hp', n: s.maxHp });

  return out.slice(0, max);
};
