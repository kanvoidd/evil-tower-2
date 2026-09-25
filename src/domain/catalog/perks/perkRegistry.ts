import type { ClassId } from '../classes/interfaces/ClassId';
import { HERO_FACTORIES } from '../heroes/heroRegistry';
import type { AbilityId } from './interfaces/AbilityId';
import type { PerkDef, PerkDefOf } from './interfaces/PerkDef';
import type { PerkSlot } from './interfaces/PerkSlot';

/**
 * Перки выпускают фабрики героев (src/domain/catalog/heroes) — здесь только реестр.
 */
export const PERKS: PerkDef[] = HERO_FACTORIES.flatMap((f) => f.createPerks());

export const PERK_BY_ID: Record<string, PerkDef> = Object.fromEntries(PERKS.map((p) => [p.id, p]));

/** Перк по id способности: у каждой способности одна запись в каталоге (проверяет selftest). */
export const PERK_BY_ABILITY = Object.fromEntries(PERKS.map((p) => [p.ability, p])) as {
  readonly [A in AbilityId]: PerkDefOf<A>;
};

export const perkId = (classId: ClassId, slot: PerkSlot): string => `${classId}_${slot}`;

export const perkOf = (classId: ClassId, slot: PerkSlot): PerkDef | undefined =>
  PERK_BY_ID[perkId(classId, slot)];

export const SLOT_ORDER: PerkSlot[] = ['start', 'p2', 'p3', 'legend'];

/** Перки класса по порядку слотов (у базового и второго класса легендарного нет). */
export const perksOfClass = (classId: ClassId): PerkDef[] =>
  SLOT_ORDER.map((s) => perkOf(classId, s)).filter((p): p is PerkDef => !!p);

/** Есть ли у перка кнопка на поле боя. */
export const hasButton = (p: PerkDef): boolean => !p.passive && !p.basic;
