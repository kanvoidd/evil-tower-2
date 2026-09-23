import type { DailyReward } from './interfaces/DailyReward';

export const DAILY_REWARDS: DailyReward[] = [
  { gold: 120 },
  { heal: 2, regen: 1 },
  { souls: 180 },
  { gold: 350 },
  { heal: 3, regen: 3 },
  { souls: 500, gold: 250 },
  { gold: 1000, souls: 800, heal: 5, regen: 5 },
];
