import type { TalentFx } from '../../../talents/interfaces/TalentFx';

/** Заготовка таланта: id, путь, ярус и место в цепочке фабрика выводит из положения в дереве. */
export interface TalentSeed {
  ru: string;
  en: string;
  fx: TalentFx;
  v: number[];
  v2?: number[];
}
