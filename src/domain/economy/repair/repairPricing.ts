import { EconomyBalance } from '../balance/EconomyBalance';
import type { IRepairPricing } from './interfaces/IRepairPricing';
import { PriceShareRepair } from './price-share-repair/PriceShareRepair';

/** Цена починки, по которой работает лавка. */
export const REPAIR_PRICING: IRepairPricing = new PriceShareRepair(EconomyBalance.repairShare);
