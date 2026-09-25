import type { Ratio } from '../../../shared';
import type { IDamageReduction } from '../interfaces/IDamageReduction';
import type { IncomingHit } from '../interfaces/IncomingHit';

/** Пока здоровья не больше порога, удары слабее. */
export class LowHpReduction implements IDamageReduction {
  static readonly HP_SHARE = 0.4;

  constructor(private readonly share: Ratio) {}

  apply(dmg: number, hit: IncomingHit): number {
    const low = hit.hero.hp <= hit.hero.maxHp * LowHpReduction.HP_SHARE;
    return low ? dmg * (1 - this.share) : dmg;
  }
}
