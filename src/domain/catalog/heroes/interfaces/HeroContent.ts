import type { ClassDef } from '../../classes/interfaces/ClassDef';
import type { BaseTree } from '../../talents/interfaces/BaseTree';
import type { LineageDef } from './LineageDef';

/**
 * Содержимое одной линейки: сама линейка и её классы. Определения лежат в папке линейки
 * (`heroes/<линейка>/`) по файлу на сущность; реестры каталога выводятся из списка `HEROES`.
 */
export interface HeroContent {
  readonly lineage: LineageDef;
  /** Классы в порядке развития: базовый и следующие ступени — с перками и талантами. */
  readonly classes: readonly ClassDef[];
  /** Дерево «Основа» — общие характеристики героя (у линеек с классами-ветками). */
  readonly baseTree?: BaseTree;
}
