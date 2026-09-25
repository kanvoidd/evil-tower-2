import { HERO_FACTORIES } from '../heroes/heroRegistry';
import type { LineageId } from '../heroes/interfaces/LineageId';
import type { ClassDef } from './interfaces/ClassDef';
import type { ClassDefinition } from './interfaces/ClassDefinition';
import type { ClassId } from './interfaces/ClassId';

const CLASS_LIST: ClassDef[] = HERO_FACTORIES.flatMap((f) => f.createClasses());

export const CLASSES = Object.fromEntries(CLASS_LIST.map((c) => [c.id, c])) as Record<
  ClassId,
  ClassDef
>;

export const CLASS_ORDER: ClassId[] = CLASS_LIST.map((c) => c.id);

export const lineageOf = (id: ClassId): LineageId => CLASSES[id].lineage;
export const baseClassOf = (l: LineageId): ClassId => l;

/** Классы линейки в порядке развития: базовый, второй, два финальных. */
export const classesOfLineage = (l: LineageId): ClassId[] =>
  CLASS_ORDER.filter((id) => CLASSES[id].lineage === l);

export const terminalsOf = (l: LineageId): ClassId[] =>
  classesOfLineage(l).filter((id) => CLASSES[id].stage === 2);

export const secondOf = (l: LineageId): ClassId =>
  classesOfLineage(l).find((id) => CLASSES[id].stage === 1)!;

/** Полные определения классов (база, способности, таланты, метаморфозы) — из фабрик героев. */
export const CLASS_DEFINITIONS = Object.fromEntries(
  HERO_FACTORIES.flatMap((f) => f.createClassDefinitions()).map((d) => [d.id, d]),
) as Record<ClassId, ClassDefinition>;
