import type { Profile } from '../../domain/account';
import type { GiftReward } from '../../domain/rewards';
import type { AdService } from '../ads/AdService';
import type { RewardChoice } from './interfaces/RewardChoice';

/**
 * Забрать «Дар башни» — бесплатный подарок раз в несколько минут. Удвоение — только за досмотренное
 * видео; без него игрок получает обычный подарок.
 */
export class ClaimTowerGift {
  constructor(
    private readonly profile: Profile,
    private readonly ads: AdService,
  ) {}

  async execute(choice: RewardChoice): Promise<GiftReward> {
    const multiplier = choice === 'double' && (await this.ads.rewarded()) ? 2 : 1;
    return this.profile.claimGift(multiplier);
  }
}
