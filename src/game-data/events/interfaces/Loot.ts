import type { ConsumableId } from '../../../types';

/** Что выпало из сундука: горсть золота или один расходник. */
export type Loot = { kind: 'gold'; amount: number } | { kind: ConsumableId; amount: 1 };
