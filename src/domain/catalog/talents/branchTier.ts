import type { TalentTierNumber } from './interfaces/TalentTierNumber';

/** Шагов ветки на одну ступень цены: перк и его талант. */
const STEPS_PER_TIER = 2;
/** Ступеней цены в ветке — как ярусов в дереве класса. */
const BRANCH_TIERS = 3;

/** Ступень цены шага ветки: два первых шага — первая, следующие два — вторая, дальше — третья. */
export const branchTier = (step: number): TalentTierNumber =>
  Math.min(BRANCH_TIERS, 1 + Math.floor(step / STEPS_PER_TIER)) as TalentTierNumber;
