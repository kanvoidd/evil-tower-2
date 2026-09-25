import type { LineageId } from '../../../catalog';
import type { PlayerCounters } from './PlayerCounters';

/**
 * Что достижения знают об игроке: счётчики и рекорды героев (сколько комнат пройдено за один
 * забег). Профиль подходит к этому виду сам — достижениям не нужен весь документ сохранения.
 */
export interface AchievementFacts {
  readonly stats: Readonly<PlayerCounters>;
  readonly heroes: Readonly<Partial<Record<LineageId, { readonly best: number }>>>;
}
