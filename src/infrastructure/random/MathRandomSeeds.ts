import type { ISeedSource } from '../../application/ports';

/** 2³²: зерно — 32-битное число без знака. */
const UINT32 = 2 ** 32;

/** Зёрна из `Math.random` — энтропия браузера. */
export class MathRandomSeeds implements ISeedSource {
  next(): number {
    return (Math.random() * UINT32) >>> 0;
  }
}
