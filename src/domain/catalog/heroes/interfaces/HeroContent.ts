import type { ClassDef } from '../../classes/interfaces/ClassDef';
import type { LineageDef } from './LineageDef';

/**
 * Содержимое одной линейки: сама линейка и её классы. Определения лежат в папке линейки
 * (`heroes/<линейка>/`) по файлу на сущность; реестры каталога выводятся из списка `HEROES`.
 */
export interface HeroContent {
  readonly lineage: LineageDef;
  /** Классы в порядке развития: базовый, второй, два финальных — с перками и деревьями талантов. */
  readonly classes: readonly ClassDef[];
}
