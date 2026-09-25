import type { IncomingHit } from './IncomingHit';

/** Снижение входящего удара: множит урон на (1 − доля) без округления — округляет броня в конце. */
export interface IDamageReduction {
  apply(dmg: number, hit: IncomingHit): number;
}
