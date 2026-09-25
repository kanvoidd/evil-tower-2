import type { ClassId } from '../classes/interfaces/ClassId';
import { HERO_FACTORIES } from '../heroes/heroRegistry';
import type { TalentDef } from './interfaces/TalentDef';
import type { TalentPath } from './interfaces/TalentPath';

/**
 * Таланты выпускают фабрики героев (src/domain/catalog/heroes) — здесь только реестр.
 */
export const TALENTS: TalentDef[] = HERO_FACTORIES.flatMap((f) => f.createTalents());

export const TALENT_BY_ID: Record<string, TalentDef> = Object.fromEntries(
  TALENTS.map((t) => [t.id, t]),
);

export const talentsOfClass = (classId: ClassId): TalentDef[] =>
  TALENTS.filter((t) => t.classId === classId);

export const talentsOfTier = (classId: ClassId, tier: number): TalentDef[] =>
  TALENTS.filter((t) => t.classId === classId && t.tier === tier);

/** Цепочка одного пути на ярусе, по порядку. */
export const talentChain = (classId: ClassId, tier: number, path: TalentPath): TalentDef[] =>
  talentsOfTier(classId, tier)
    .filter((t) => t.path === path)
    .sort((a, b) => a.step - b.step);

export const maxRank = (t: TalentDef): number => t.v.length;

/** Значение эффекта на купленном ранге (0 — талант не изучен). */
export const talentValue = (t: TalentDef, rank: number): number =>
  rank <= 0 ? 0 : t.v[Math.min(rank, t.v.length) - 1];

/** Второе значение ранга — для эффектов вида «шанс / сила». */
export const talentValue2 = (t: TalentDef, rank: number): number =>
  rank <= 0 || !t.v2 ? 0 : t.v2[Math.min(rank, t.v2.length) - 1];
