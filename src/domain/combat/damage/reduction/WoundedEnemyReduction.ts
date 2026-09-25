import type { Ratio } from '../../../shared';
import type { IDamageReduction } from '../interfaces/IDamageReduction';
import type { IncomingHit } from '../interfaces/IncomingHit';

/** Раненый героем враг бьёт слабее. */
export class WoundedEnemyReduction implements IDamageReduction {
  constructor(private readonly share: Ratio) {}

  apply(dmg: number, hit: IncomingHit): number {
    return hit.enemy && hit.enemy.hits > 0 ? dmg * (1 - this.share) : dmg;
  }
}
