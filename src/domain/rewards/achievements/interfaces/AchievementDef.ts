import type { AchievementFacts } from './AchievementFacts';

/** Достижение; название и описание — в словарях по id (`ach.<id>.name`, `ach.<id>.desc`). */
export interface AchievementDef {
  id: string;
  target: number;
  /** Этаж для достижений «пройдите этаж» — и для прогресса, и для текста. */
  floor?: number;
  /** Текущее значение прогресса по счётчикам и рекордам игрока. */
  progress: (s: AchievementFacts) => number;
}
