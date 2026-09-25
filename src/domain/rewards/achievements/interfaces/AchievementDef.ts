import type { AchievementFacts } from './AchievementFacts';

export interface AchievementDef {
  id: string;
  name: { ru: string; en: string };
  desc: { ru: string; en: string };
  target: number;
  /** Текущее значение прогресса по счётчикам и рекордам игрока. */
  progress: (s: AchievementFacts) => number;
}
