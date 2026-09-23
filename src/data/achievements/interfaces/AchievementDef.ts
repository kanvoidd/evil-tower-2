import type { SaveData } from '../../../types';

export interface AchievementDef {
  id: string;
  name: { ru: string; en: string };
  desc: { ru: string; en: string };
  target: number;
  /** Текущее значение прогресса из сохранения. */
  progress: (s: SaveData) => number;
}
