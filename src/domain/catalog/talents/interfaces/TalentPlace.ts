import type { ClassId } from '../../classes/interfaces/ClassId';
import type { TalentDef } from './TalentDef';
import type { TalentPath } from './TalentPath';
import type { TalentTab } from './TalentTab';
import type { TalentTierNumber } from './TalentTierNumber';

/** Место таланта в дереве — выводит реестр из классов и деревьев «Основа». */
export interface TalentPlace {
  /**
   * Ключ сохранения (узел `tal/<id>`): сохранение помнит ранг места, а не таланта.
   * - класс с ярусами: `knight/a1-2` — класс, путь (a/v/g), ярус, место в цепочке;
   * - «Основа»: `mage/base-a1-2` — базовый класс линейки, дальше так же;
   * - ветка: `elementalist/fire-2` — класс, ветка, номер шага с единицы.
   */
  readonly id: string;
  /** Класс, которому принадлежит место (у «Основы» — базовый класс линейки). */
  readonly classId: ClassId;
  readonly tab: TalentTab;
  readonly path: TalentPath;
  readonly tier: TalentTierNumber;
  /** Место в цепочке яруса или номер шага в ветке, начиная с нуля. */
  readonly step: number;
  /** Ветка класса (только у талантов в ветках). */
  readonly branch?: string;
  readonly talent: TalentDef;
}
