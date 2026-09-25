import type { Profile } from '../../domain/account/profile';
import type { IPlatform } from '../ports/IPlatform';
import { AD_POLICY } from './adPolicy';

/**
 * Реклама по правилам каталога: с наградой — только по желанию игрока, полноэкранная — только
 * в логических паузах (уход из боя), не раньше нескольких комнат и не чаще собственного кулдауна
 * поверх лимитов платформы. На время показа игра отмечается как «на паузе».
 */
export class AdService {
  constructor(
    private readonly platform: IPlatform,
    private readonly profile: Profile,
    private readonly now: () => number,
  ) {}

  /** true — видео досмотрено, награду нужно выдать. */
  rewarded(): Promise<boolean> {
    this.platform.gameplayStop();
    return this.platform.showRewarded();
  }

  /** Полноэкранная реклама, если по политике уже можно. */
  async interstitial(): Promise<void> {
    if (this.profile.roomsPlayedTotal < AD_POLICY.firstAdAfterRooms) return;
    if (this.now() - this.profile.lastInterstitial < AD_POLICY.interstitialCooldownMs) return;
    this.platform.gameplayStop();
    const shown = await this.platform.showInterstitial();
    if (shown) this.profile.noteInterstitial(this.now());
  }
}
