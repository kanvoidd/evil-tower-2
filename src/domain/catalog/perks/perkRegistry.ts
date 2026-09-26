import type { AbilityId } from '../abilities/interfaces/AbilityId';
import { isBranched } from '../classes/classKinds';
import type { ClassDef } from '../classes/interfaces/ClassDef';
import type { ClassId } from '../classes/interfaces/ClassId';
import { HEROES } from '../heroes/heroRegistry';
import type { PerkDef } from './interfaces/PerkDef';
import type { PerkSlot, TieredPerkSlot } from './interfaces/PerkSlot';

export const SLOT_ORDER: TieredPerkSlot[] = ['start', 'p2', 'p3', 'legend'];

export const perkId = (classId: ClassId, slot: PerkSlot): string => `${classId}_${slot}`;

/** Слот шага ветки: `<ветка>-<номер шага с единицы>`. */
export const branchSlot = (branch: string, step: number): PerkSlot => `${branch}-${step + 1}`;

/** Перки класса: у классов с ярусами — по слотам, у классов с ветками — по веткам и шагам. */
const perksOf = (c: ClassDef): PerkDef[] => {
  if (!isBranched(c))
    return SLOT_ORDER.flatMap((slot) => {
      const ability = c.perks[slot];
      return ability ? [{ id: perkId(c.id, slot), classId: c.id, slot, ability }] : [];
    });
  return c.branches.flatMap((b) =>
    b.steps.flatMap((s, step) => {
      if (!('perk' in s)) return [];
      const slot = branchSlot(b.id, step);
      return [{ id: perkId(c.id, slot), classId: c.id, slot, ability: s.perk, branch: b.id, step }];
    }),
  );
};

/** Перки всех классов — по классам, внутри класса — по порядку слотов или шагов веток. */
export const PERKS: PerkDef[] = HEROES.flatMap((h) => h.classes).flatMap(perksOf);

export const PERK_BY_ID: Record<string, PerkDef> = Object.fromEntries(PERKS.map((p) => [p.id, p]));

/** Перк, который выдаёт способность: у каждой способности не больше одного (проверяет selftest). */
export const PERK_BY_ABILITY: Readonly<Record<AbilityId, PerkDef>> = Object.fromEntries(
  PERKS.map((p) => [p.ability.id, p]),
);

export const perkOf = (classId: ClassId, slot: PerkSlot): PerkDef | undefined =>
  PERK_BY_ID[perkId(classId, slot)];

/** Перки класса по порядку. */
export const perksOfClass = (classId: ClassId): PerkDef[] =>
  PERKS.filter((p) => p.classId === classId);
