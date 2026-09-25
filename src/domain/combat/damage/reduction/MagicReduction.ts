import type { Ratio } from '../../../shared';
import type { IDamageReduction } from '../interfaces/IDamageReduction';
import type { IncomingHit } from '../interfaces/IncomingHit';

/** Сопротивление магии: удар врага-мага слабее. */
export class MagicReduction implements IDamageReduction {
  constructor(private readonly share: Ratio) {}

  apply(dmg: number, hit: IncomingHit): number {
    return hit.def?.magic ? dmg * (1 - this.share) : dmg;
  }
}
