import type { LineageId } from '../../heroes/interfaces/LineageId';
import type { Stats } from '../../heroes/interfaces/Stats';
import type { ClassId } from './ClassId';

export interface ClassDef {
  id: ClassId;
  lineage: LineageId;
  /** 0 — базовый, 1 — вторая ступень, 2 — финальный (раздвоение). */
  stage: 0 | 1 | 2;
  parent: ClassId | null;
  /** Аддитивные бонусы класса к базовым характеристикам. */
  mods: Partial<Stats>;
}
