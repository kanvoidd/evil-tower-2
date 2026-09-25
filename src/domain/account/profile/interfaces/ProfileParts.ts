import type { AchievementTracker } from '../achievement-tracker/AchievementTracker';
import type { AutomationSettings } from '../automation-settings/AutomationSettings';
import type { DailyRewards } from '../daily-rewards/DailyRewards';
import type { HeroRoster } from '../hero-roster/HeroRoster';
import type { HeroWallets } from '../hero-wallets/HeroWallets';
import type { PlayerSettings } from '../player-settings/PlayerSettings';
import type { TowerGift } from '../tower-gift/TowerGift';

/** Части профиля: каждая зовёт другие по имени. */
export interface ProfileParts {
  readonly settings: PlayerSettings;
  readonly automation: AutomationSettings;
  readonly heroes: HeroRoster;
  readonly wallets: HeroWallets;
  readonly achievements: AchievementTracker;
  readonly daily: DailyRewards;
  readonly gift: TowerGift;
}
