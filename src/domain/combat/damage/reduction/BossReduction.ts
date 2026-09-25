import type { Ratio } from '../../../shared';
import type { IDamageReduction } from '../interfaces/IDamageReduction';
import type { IncomingHit } from '../interfaces/IncomingHit';

/** Удар босса слабее. */
export class BossReduction implements IDamageReduction {
  constructor(private readonly share: Ratio) {}

  apply(dmg: number, hit: IncomingHit): number {
    return hit.def?.boss ? dmg * (1 - this.share) : dmg;
  }
}
