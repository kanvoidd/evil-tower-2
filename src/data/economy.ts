import type { ClassId, StatKey } from '../types';
import { CLASSES } from './classes';

/** Что даёт один узел skill-tree. */
export const NODE_VALUE: Record<Exclude<StatKey, 'luck'>, number> = {
  damage: 1,
  crit: 2,
  health: 2,
  dodge: 2,
  defense: 1,
  parry: 2,
};

/** Базовая цена узла по ступени класса (0/1/2) и сегменту (0/1/2). */
const NODE_BASE: number[][] = [
  [10, 55, 170],
  [260, 480, 800],
  [1100, 1800, 2700],
];

export const stageOf = (owner: ClassId): number => CLASSES[owner].stage;

export const nodeCost = (owner: ClassId, seg: number, tier: number): number =>
  Math.round(NODE_BASE[stageOf(owner)][seg] * (1 + 0.25 * (tier - 1)));

export const perkCost = (owner: ClassId, seg: number): number => {
  if (seg === 0) return 0;
  if (seg === 3) return NODE_BASE[2][2] * 8;
  return NODE_BASE[stageOf(owner)][seg] * 6;
};

export const classCost = (classId: ClassId): number => (CLASSES[classId].stage === 1 ? 1500 : 7000);

/** Стоимость метаморфозы в опыте душ. */
export const metamorphosisCost = classCost;

export const DAILY_REWARDS: Array<{ gold?: number; souls?: number; heal?: number; regen?: number }> = [
  { gold: 100 },
  { heal: 2, regen: 1 },
  { souls: 150 },
  { gold: 300 },
  { heal: 3, regen: 3 },
  { souls: 400, gold: 200 },
  { gold: 800, souls: 600, heal: 5, regen: 5 },
];

export const GIFT_REWARD = { gold: 60, souls: 30 };
