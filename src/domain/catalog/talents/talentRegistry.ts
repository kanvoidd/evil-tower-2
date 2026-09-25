import type { ClassId } from '../classes/interfaces/ClassId';
import { HEROES } from '../heroes/heroRegistry';
import type { TalentDef } from './interfaces/TalentDef';
import type { TalentPath } from './interfaces/TalentPath';
import type { TalentPlace } from './interfaces/TalentPlace';
import type { TalentTierNumber } from './interfaces/TalentTierNumber';
import { PATH_ORDER } from './pathOrder';

/** Буква пути в позиционном id места (`mage/a1-2`) — из сохранений, менять нельзя. */
const PATH_LETTER: Readonly<Record<TalentPath, string>> = {
  attack: 'a',
  vitality: 'v',
  guard: 'g',
};

/**
 * Места талантов в деревьях всех классов — из `ClassDef.talents`: по классам, ярусам, путям
 * (`PATH_ORDER`) и месту в цепочке. Сами таланты — в `heroes/<линейка>/talents/<класс>.ts`.
 */
export const TALENT_PLACES: readonly TalentPlace[] = HEROES.flatMap((h) => h.classes).flatMap(
  (c) => {
    const out: TalentPlace[] = [];
    c.talents.forEach((tierDef, ti) => {
      const tier = (ti + 1) as TalentTierNumber;
      for (const path of PATH_ORDER) {
        tierDef[path].forEach((talent, step) => {
          const id = `${c.id}/${PATH_LETTER[path]}${tier}-${step + 1}`;
          out.push({ id, classId: c.id, path, tier, step, talent });
        });
      }
    });
    return out;
  },
);

export const TALENT_PLACE_BY_ID: Readonly<Record<string, TalentPlace>> = Object.fromEntries(
  TALENT_PLACES.map((t) => [t.id, t]),
);

/** Таланты игры — по одному на место дерева. */
export const TALENTS: readonly TalentDef[] = TALENT_PLACES.map((p) => p.talent);

export const placesOfClass = (classId: ClassId): TalentPlace[] =>
  TALENT_PLACES.filter((t) => t.classId === classId);

export const placesOfTier = (classId: ClassId, tier: number): TalentPlace[] =>
  TALENT_PLACES.filter((t) => t.classId === classId && t.tier === tier);

/** Цепочка одного пути на ярусе, по порядку. */
export const talentChain = (classId: ClassId, tier: number, path: TalentPath): TalentPlace[] =>
  placesOfTier(classId, tier)
    .filter((t) => t.path === path)
    .sort((a, b) => a.step - b.step);
