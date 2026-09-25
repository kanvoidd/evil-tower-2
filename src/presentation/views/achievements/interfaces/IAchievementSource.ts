import type { AchievementDef } from '../../../../domain/rewards';

/** Откуда список достижений берёт, что открыто и сколько пройдено. */
export interface IAchievementSource {
  readonly achievements: readonly string[];
  achievementProgress(a: AchievementDef): number;
}
