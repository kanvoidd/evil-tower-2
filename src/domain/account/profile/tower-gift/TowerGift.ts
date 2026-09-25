import { GIFT_COOLDOWN_MS, GIFT_REWARD } from '../../../rewards';
import { Gold, Souls } from '../../../shared';
import { ProfilePart } from '../profile-part/ProfilePart';

/** «Дар башни»: подарок по таймеру, снова готов через `GIFT_COOLDOWN_MS` после получения. */
export class TowerGift extends ProfilePart {
  ready(): boolean {
    return this.state.now() >= this.doc.gift.readyAt;
  }

  remainingMs(): number {
    return Math.max(0, this.doc.gift.readyAt - this.state.now());
  }

  claim(multiplier = 1): typeof GIFT_REWARD {
    const gift = {
      gold: Gold.of(GIFT_REWARD.gold * multiplier),
      souls: Souls.of(GIFT_REWARD.souls * multiplier),
    };
    this.parts.wallets.addGold(gift.gold);
    this.parts.wallets.addSouls(gift.souls);
    this.doc.gift.readyAt = this.state.now() + GIFT_COOLDOWN_MS;
    this.state.touch();
    return gift;
  }
}
