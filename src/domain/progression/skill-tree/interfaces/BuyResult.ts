import type { Souls } from '../../../shared';

/** Можно ли купить узел: да — и за сколько, нет — почему. */
export type BuyResult = { ok: true; cost: Souls } | { ok: false; reason: 'state' | 'souls' };
