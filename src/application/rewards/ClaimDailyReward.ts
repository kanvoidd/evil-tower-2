import type { Profile } from '../../domain/account';
import type { DailyReward } from '../../domain/rewards';
import type { AdService } from '../ads/AdService';
import type { RewardChoice } from './interfaces/RewardChoice';

/**
 * Забрать ежедневную награду. Удвоение — только за досмотренное видео; если видео не показалось
 * или его закрыли, игрок всё равно получает обычную награду: реклама никогда не отнимает заработанное.
 */
export class ClaimDailyReward {
  constructor(
    private readonly profile: Profile,
    private readonly ads: AdService,
  ) {}

  async execute(choice: RewardChoice): Promise<DailyReward | null> {
    const multiplier = choice === 'double' && (await this.ads.rewarded()) ? 2 : 1;
    return this.profile.claimDaily(multiplier);
  }
}
