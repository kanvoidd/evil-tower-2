import type { TalentFx } from '../../../talents/interfaces/TalentFx';

/**
 * Заготовка таланта: id, путь, ярус и место в цепочке фабрика выводит из положения в дереве.
 * Название — в словарях по id таланта (`talent.<id>.name`).
 */
export interface TalentSeed {
  fx: TalentFx;
  v: number[];
  v2?: number[];
}
