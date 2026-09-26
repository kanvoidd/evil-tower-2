import { isBranched } from '../classes/classKinds';
import type { ClassDef } from '../classes/interfaces/ClassDef';
import type { ClassId } from '../classes/interfaces/ClassId';
import { HEROES } from '../heroes/heroRegistry';
import { branchTier } from './branchTier';
import type { TalentDef } from './interfaces/TalentDef';
import type { TalentPath } from './interfaces/TalentPath';
import type { TalentPlace } from './interfaces/TalentPlace';
import type { TalentTab } from './interfaces/TalentTab';
import type { TalentTier } from './interfaces/TalentTier';
import type { TalentTierNumber } from './interfaces/TalentTierNumber';
import { PATH_ORDER } from './pathOrder';

/** Буква пути в позиционном id места (`knight/a1-2`) — из сохранений, менять нельзя. */
const PATH_LETTER: Readonly<Record<TalentPath, string>> = {
  attack: 'a',
  vitality: 'v',
  guard: 'g',
};

/** Таланты веток правят перки и бьют сильнее — в дереве они на пути урона. */
const BRANCH_PATH: TalentPath = 'attack';

/** Места ярусов: цепочки путей по ярусам (дерево класса с ярусами или «Основа»). */
const tierPlaces = (
  classId: ClassId,
  tab: TalentTab,
  prefix: string,
  tiers: readonly TalentTier[],
): TalentPlace[] => {
  const out: TalentPlace[] = [];
  tiers.forEach((tierDef, ti) => {
    const tier = (ti + 1) as TalentTierNumber;
    for (const path of PATH_ORDER) {
      tierDef[path].forEach((talent, step) => {
        const id = `${prefix}${PATH_LETTER[path]}${tier}-${step + 1}`;
        out.push({ id, classId, tab, path, tier, step, talent });
      });
    }
  });
  return out;
};

/** Id места таланта на шаге ветки: `<класс>/<ветка>-<номер шага с единицы>`. */
export const branchPlaceId = (classId: ClassId, branch: string, step: number): string =>
  `${classId}/${branch}-${step + 1}`;

/** Место таланта на шаге ветки. */
const branchPlace = (
  c: ClassDef,
  branch: string,
  step: number,
  talent: TalentDef,
): TalentPlace => ({
  id: branchPlaceId(c.id, branch, step),
  classId: c.id,
  tab: 'profession',
  path: BRANCH_PATH,
  tier: branchTier(step),
  step,
  branch,
  talent,
});

/** Места талантов класса: по ярусам или по шагам веток. */
const classPlaces = (c: ClassDef): TalentPlace[] => {
  if (!isBranched(c)) return tierPlaces(c.id, 'profession', `${c.id}/`, c.talents);
  return c.branches.flatMap((b) =>
    b.steps.flatMap((s, step) => ('talent' in s ? [branchPlace(c, b.id, step, s.talent)] : [])),
  );
};

/**
 * Места талантов всех деревьев: «Основы» линеек и классов (по ярусам или веткам). Сами
 * таланты — в `heroes/<линейка>/talents/`.
 */
export const TALENT_PLACES: readonly TalentPlace[] = HEROES.flatMap((h) => {
  const base = h.classes.find((c) => c.stage === 0)!;
  const own = h.baseTree ? tierPlaces(base.id, 'base', `${base.id}/base-`, h.baseTree) : [];
  return [...own, ...h.classes.flatMap(classPlaces)];
});

export const TALENT_PLACE_BY_ID: Readonly<Record<string, TalentPlace>> = Object.fromEntries(
  TALENT_PLACES.map((t) => [t.id, t]),
);

/** Таланты игры — по одному на место дерева. */
export const TALENTS: readonly TalentDef[] = TALENT_PLACES.map((p) => p.talent);

/** Таланты класса (без «Основы» линейки). */
export const placesOfClass = (classId: ClassId): TalentPlace[] =>
  TALENT_PLACES.filter((t) => t.classId === classId && t.tab === 'profession');

/** Таланты «Основы» линейки, базовый класс которой — `baseClass`. */
export const basePlacesOf = (baseClass: ClassId): TalentPlace[] =>
  TALENT_PLACES.filter((t) => t.classId === baseClass && t.tab === 'base');

export const placesOfTier = (
  classId: ClassId,
  tier: number,
  tab: TalentTab = 'profession',
): TalentPlace[] =>
  TALENT_PLACES.filter((t) => t.classId === classId && t.tier === tier && t.tab === tab);

/** Цепочка одного пути на ярусе, по порядку. */
export const talentChain = (
  classId: ClassId,
  tier: number,
  path: TalentPath,
  tab: TalentTab = 'profession',
): TalentPlace[] =>
  placesOfTier(classId, tier, tab)
    .filter((t) => t.path === path)
    .sort((a, b) => a.step - b.step);
