import type { AbilityId } from '../abilities/interfaces/AbilityId';
import type { ClassId } from '../classes/interfaces/ClassId';
import { HEROES } from '../heroes/heroRegistry';
import type { PerkDef } from './interfaces/PerkDef';
import type { PerkSlot } from './interfaces/PerkSlot';

export const SLOT_ORDER: PerkSlot[] = ['start', 'p2', 'p3', 'legend'];

export const perkId = (classId: ClassId, slot: PerkSlot): string => `${classId}_${slot}`;

/** Перки всех классов — из `ClassDef.perks`: по классам, внутри класса — по порядку слотов. */
export const PERKS: PerkDef[] = HEROES.flatMap((h) => h.classes).flatMap((c) =>
  SLOT_ORDER.flatMap((slot) => {
    const ability = c.perks[slot];
    return ability ? [{ id: perkId(c.id, slot), classId: c.id, slot, ability }] : [];
  }),
);

export const PERK_BY_ID: Record<string, PerkDef> = Object.fromEntries(PERKS.map((p) => [p.id, p]));

/** Перк, который выдаёт способность: у каждой способности не больше одного (проверяет selftest). */
export const PERK_BY_ABILITY: Readonly<Record<AbilityId, PerkDef>> = Object.fromEntries(
  PERKS.map((p) => [p.ability.id, p]),
);

export const perkOf = (classId: ClassId, slot: PerkSlot): PerkDef | undefined =>
  PERK_BY_ID[perkId(classId, slot)];

/** Перки класса по порядку слотов (у базового и второго класса легендарного нет). */
export const perksOfClass = (classId: ClassId): PerkDef[] =>
  SLOT_ORDER.map((s) => perkOf(classId, s)).filter((p): p is PerkDef => !!p);
