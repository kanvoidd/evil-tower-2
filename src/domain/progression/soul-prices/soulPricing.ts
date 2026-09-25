import { ProgressionBalance } from '../balance/ProgressionBalance';
import { SoulPriceBalance } from '../balance/SoulPriceBalance';
import type { ISoulPricing } from './interfaces/ISoulPricing';
import { StageTablePricing } from './stage-table-pricing/StageTablePricing';

/** Цены в душах, по которым играет игра. */
export const SOUL_PRICING: ISoulPricing = new StageTablePricing(
  SoulPriceBalance,
  ProgressionBalance.cancelMetamorphosisRefund,
);
