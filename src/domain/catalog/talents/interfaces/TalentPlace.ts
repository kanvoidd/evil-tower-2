import type { ClassId } from '../../classes/interfaces/ClassId';
import type { TalentDef } from './TalentDef';
import type { TalentPath } from './TalentPath';
import type { TalentTierNumber } from './TalentTierNumber';

/** Место таланта в дереве класса — выводит реестр из `ClassDef.talents`. */
export interface TalentPlace {
  /**
   * `mage/a1-2` — класс, путь (a/v/g), ярус и место в цепочке. Это ключ сохранения (узел
   * `tal/<id>`): сохранение помнит ранг места, а не таланта.
   */
  readonly id: string;
  readonly classId: ClassId;
  readonly path: TalentPath;
  readonly tier: TalentTierNumber;
  /** Место в цепочке яруса, начиная с нуля. */
  readonly step: number;
  readonly talent: TalentDef;
}
