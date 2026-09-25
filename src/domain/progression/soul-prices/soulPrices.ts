import { CLASSES, type ClassId, type PerkSlot } from '../../catalog';
import { Souls } from '../../shared';
import { SoulPriceBalance } from '../balance/SoulPriceBalance';

const { talentBase: TALENT_BASE, rankStep: RANK_STEP, perkMul: PERK_MUL } = SoulPriceBalance;

export const stageOf = (owner: ClassId): number => CLASSES[owner].stage;

export const talentRankCost = (owner: ClassId, tier: number, rank: number): Souls =>
  Souls.of(Math.round(TALENT_BASE[stageOf(owner)][tier - 1] * (1 + RANK_STEP * (rank - 1))));

/** Сколько стоит прокачать талант с нуля до `rank` включительно. */
export const talentTotalCost = (owner: ClassId, tier: number, rank: number): Souls => {
  let sum = 0;
  for (let r = 1; r <= rank; r++) sum += talentRankCost(owner, tier, r);
  return Souls.of(sum);
};

export const perkCost = (owner: ClassId, slot: PerkSlot): Souls => {
  if (slot === 'start') return Souls.of(0);
  const tierIdx = slot === 'p2' ? 0 : slot === 'p3' ? 1 : 2;
  return Souls.of(Math.round(TALENT_BASE[stageOf(owner)][tierIdx] * PERK_MUL[slot]));
};

/** Стоимость метаморфозы в опыте душ. */
export const classCost = (classId: ClassId): Souls =>
  Souls.of(
    CLASSES[classId].stage === 1
      ? SoulPriceBalance.metamorphosis.second
      : SoulPriceBalance.metamorphosis.final,
  );

export const metamorphosisCost = classCost;
