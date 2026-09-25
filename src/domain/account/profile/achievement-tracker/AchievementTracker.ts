import { type AchievementDef, ACHIEVEMENTS } from '../../../rewards';
import type { SaveData } from '../../save/interfaces/SaveData';
import { ProfilePart } from '../profile-part/ProfilePart';

/** Счётчики игрока и достижения по ним: открываются сами, как только цель достигнута. */
export class AchievementTracker extends ProfilePart {
  get stats(): Readonly<SaveData['stats']> {
    return this.doc.stats;
  }

  bump(key: keyof SaveData['stats'], n = 1): void {
    this.doc.stats[key] += n;
    this.check();
    this.state.touch();
  }

  /** Сколько комнат сыграно всего — пройдено или проиграно. */
  get roomsPlayedTotal(): number {
    return this.doc.stats.roomsCleared + this.doc.stats.deaths;
  }

  get achievements(): readonly string[] {
    return this.doc.achievements;
  }

  /** Прогресс достижения по сохранению — не больше его цели. */
  progress(a: AchievementDef): number {
    return Math.min(a.target, a.progress(this.doc));
  }

  /** Открыть достижения, цель которых уже достигнута. */
  check(): void {
    for (const a of ACHIEVEMENTS) {
      if (this.doc.achievements.includes(a.id)) continue;
      if (a.progress(this.doc) >= a.target) {
        this.doc.achievements.push(a.id);
        this.state.achievementUnlocked.emit(a.id);
      }
    }
  }
}
