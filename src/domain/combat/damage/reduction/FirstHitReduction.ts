import type { Ratio } from '../../../shared';
import type { IDamageReduction } from '../interfaces/IDamageReduction';
import type { IncomingHit } from '../interfaces/IncomingHit';

/** Первый удар каждого врага слабее. */
export class FirstHitReduction implements IDamageReduction {
  constructor(private readonly share: Ratio) {}

  apply(dmg: number, hit: IncomingHit): number {
    return hit.enemy && hit.enemy.swings === 0 ? dmg * (1 - this.share) : dmg;
  }
}
