import type { Ratio } from './Ratio';

/** Проценты: 25 — это 25 %. Шансы и бонусы в процентах — так их задают таланты и враги. */
export type Percent = number & { readonly __unit: 'percent' };

export const Percent = {
  of: (n: number): Percent => n as Percent,
  /** Проценты в доли: 25 % → 0,25. Единственное место, где проценты делятся на 100. */
  toRatio: (p: Percent): Ratio => (p / 100) as Ratio,
};
