export interface Rng {
  next(): number;
  int(min: number, max: number): number;
  chance(p: number): boolean;
  pick<T>(arr: readonly T[]): T;
  shuffle<T>(arr: T[]): T[];
}

/** 2³² — делитель, который переводит 32-битное слово в [0, 1). */
const UINT32 = 4294967296;

/** mulberry32 — маленький детерминированный генератор; числа внутри `next` — сам алгоритм. */
export const makeRng = (seed: number): Rng => {
  let a = seed >>> 0;
  const next = (): number => {
    /* eslint-disable @typescript-eslint/no-magic-numbers -- константы алгоритма mulberry32 */
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / UINT32;
    /* eslint-enable @typescript-eslint/no-magic-numbers */
  };
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    chance: (p) => next() < p,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    shuffle: (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },
  };
};
