import type { Ratio } from '../../../shared';
import type { IDamageReduction } from '../interfaces/IDamageReduction';
import type { IncomingHit } from '../interfaces/IncomingHit';

/** Удар, отнимающий больше порога здоровья, слабее. */
export class BigHitReduction implements IDamageReduction {
  static readonly HP_SHARE = 0.4;

  constructor(private readonly share: Ratio) {}

  apply(dmg: number, hit: IncomingHit): number {
    return dmg > hit.hero.maxHp * BigHitReduction.HP_SHARE ? dmg * (1 - this.share) : dmg;
  }
}
