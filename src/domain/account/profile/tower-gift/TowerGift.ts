import { GIFT_COOLDOWN_MS, type GiftReward, towerGiftFor } from '../../../rewards';
import { Gold, Souls } from '../../../shared';
import { ProfilePart } from '../profile-part/ProfilePart';

/**
 * «Дар башни»: подарок по таймеру, снова готов через `GIFT_COOLDOWN_MS` после получения. Размер
 * растёт с рекордом активного героя (`towerGiftFor`).
 */
export class TowerGift extends ProfilePart {
  ready(): boolean {
    return this.state.now() >= this.doc.gift.readyAt;
  }

  remainingMs(): number {
    return Math.max(0, this.doc.gift.readyAt - this.state.now());
  }

  /** Сколько даст подарок активному герою сейчас (без удвоения). */
  next(): GiftReward {
    return towerGiftFor(this.parts.wallets.best);
  }

  claim(multiplier = 1): GiftReward {
    const base = this.next();
    const gift = {
      gold: Gold.of(base.gold * multiplier),
      souls: Souls.of(base.souls * multiplier),
    };
    this.parts.wallets.addGold(gift.gold);
    this.parts.wallets.addSouls(gift.souls);
    this.doc.gift.readyAt = this.state.now() + GIFT_COOLDOWN_MS;
    this.state.touch();
    return gift;
  }
}
