import { HEROES, LINEAGES } from '../heroes/heroRegistry';
import type { LineageId } from '../heroes/interfaces/LineageId';
import type { Stats } from '../heroes/interfaces/Stats';
import { PERKS } from '../perks/perkRegistry';
import { placesOfClass } from '../talents/talentRegistry';
import type { ClassDef } from './interfaces/ClassDef';
import type { ClassDefinition } from './interfaces/ClassDefinition';
import type { ClassId } from './interfaces/ClassId';

const CLASS_LIST: readonly ClassDef[] = HEROES.flatMap((h) => h.classes);

export const CLASSES = Object.fromEntries(CLASS_LIST.map((c) => [c.id, c])) as Record<
  ClassId,
  ClassDef
>;

export const CLASS_ORDER: ClassId[] = CLASS_LIST.map((c) => c.id);

export const lineageOf = (id: ClassId): LineageId => CLASSES[id].lineage;

/** Классы линейки в порядке развития: базовый, следующие ступени. */
export const classesOfLineage = (l: LineageId): ClassId[] =>
  CLASS_ORDER.filter((id) => CLASSES[id].lineage === l);

/** Базовый класс линейки — с него начинает новый герой. */
export const baseClassOf = (l: LineageId): ClassId =>
  classesOfLineage(l).find((id) => CLASSES[id].stage === 0)!;

/** Финальные классы линейки с ярусами (у линеек с ветками их пока нет). */
export const terminalsOf = (l: LineageId): ClassId[] =>
  classesOfLineage(l).filter((id) => CLASSES[id].stage === 2);

/** Вторая ступень линейки с ярусами. */
export const secondOf = (l: LineageId): ClassId =>
  classesOfLineage(l).find((id) => CLASSES[id].stage === 1)!;

/** Классы, в которые ведёт метаморфоза из `id`. */
export const childrenOf = (id: ClassId): ClassId[] =>
  CLASS_ORDER.filter((c) => CLASSES[c].parents.includes(id));

/**
 * Соседи по выбору: классы, в которые ведёт та же метаморфоза (финалы воина, подклассы мага).
 * Из соседей герой выбирает один — остальные закрываются.
 */
export const siblingsOf = (id: ClassId): ClassId[] => {
  const own = CLASSES[id].parents;
  if (!own.length) return [];
  return CLASS_ORDER.filter(
    (c) =>
      c !== id &&
      CLASSES[c].parents.length === own.length &&
      CLASSES[c].parents.every((p) => own.includes(p)),
  );
};

/** База линейки с прибавками класса. */
const withBonuses = (base: Stats, bonuses: Partial<Stats>): Stats => {
  const out = { ...base };
  for (const k of Object.keys(out) as Array<keyof Stats>) out[k] = base[k] + (bonuses[k] ?? 0);
  return out;
};

/**
 * Полные определения классов — что класс даёт любому герою, который им станет: база линейки
 * плюс прибавки класса, его способности и таланты, и куда из него ведёт метаморфоза.
 */
export const CLASS_DEFINITIONS = Object.fromEntries(
  CLASS_LIST.map((c): [ClassId, ClassDefinition] => {
    const lineage = LINEAGES[c.lineage];
    return [
      c.id,
      {
        id: c.id,
        lineage,
        stage: c.stage,
        parents: c.parents,
        baseStats: withBonuses(lineage.base, c.bonuses),
        abilities: PERKS.filter((p) => p.classId === c.id),
        talents: placesOfClass(c.id),
        next: childrenOf(c.id),
      },
    ];
  }),
) as Record<ClassId, ClassDefinition>;
