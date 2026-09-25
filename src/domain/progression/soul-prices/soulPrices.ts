import { CLASSES } from '../../catalog/classes/classRegistry';
import type { PerkSlot } from '../../catalog/perks/interfaces/PerkSlot';
import type { ClassId } from '../../types';

/**
 * Экономика опыта душ. Узлов стало мало (девять талантов на класс вместо сотни шариков),
 * поэтому каждая покупка стоит заметно дороже — но и даёт заметно больше.
 *
 * Базовая цена ранга зависит от ступени класса (0/1/2) и яруса таланта (1/2/3).
 */
const TALENT_BASE: number[][] = [
  [14, 48, 135], // базовый класс
  [420, 880, 1550], // вторая ступень
  [1600, 2800, 4300], // финальные классы
];

/** Каждый следующий ранг одного и того же таланта дороже предыдущего. */
const RANK_STEP = 0.35;

export const stageOf = (owner: ClassId): number => CLASSES[owner].stage;

export const talentRankCost = (owner: ClassId, tier: number, rank: number): number =>
  Math.round(TALENT_BASE[stageOf(owner)][tier - 1] * (1 + RANK_STEP * (rank - 1)));

/** Сколько стоит прокачать талант с нуля до `rank` включительно. */
export const talentTotalCost = (owner: ClassId, tier: number, rank: number): number => {
  let sum = 0;
  for (let r = 1; r <= rank; r++) sum += talentRankCost(owner, tier, r);
  return sum;
};

/** Множители цены перков относительно базовой цены яруса того же уровня. */
const PERK_MUL: Record<PerkSlot, number> = { start: 0, p2: 8, p3: 7, legend: 6 };

export const perkCost = (owner: ClassId, slot: PerkSlot): number => {
  if (slot === 'start') return 0;
  const tierIdx = slot === 'p2' ? 0 : slot === 'p3' ? 1 : 2;
  return Math.round(TALENT_BASE[stageOf(owner)][tierIdx] * PERK_MUL[slot]);
};

/** Стоимость метаморфозы в опыте душ. */
export const classCost = (classId: ClassId): number =>
  CLASSES[classId].stage === 1 ? 3500 : 12000;

export const metamorphosisCost = classCost;
