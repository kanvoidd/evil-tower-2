import type { ClassId, LineageId, Stats } from '../../../types';

export interface ClassDef {
  id: ClassId;
  lineage: LineageId;
  /** 0 — базовый, 1 — вторая ступень, 2 — финальный (раздвоение). */
  stage: 0 | 1 | 2;
  parent: ClassId | null;
  /** Аддитивные бонусы класса к базовым характеристикам. */
  mods: Partial<Stats>;
}
