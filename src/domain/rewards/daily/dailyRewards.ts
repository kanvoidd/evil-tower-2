import { Gold, Souls } from '../../shared';
import type { DailyReward } from './interfaces/DailyReward';

export const DAILY_REWARDS: DailyReward[] = [
  { gold: Gold.of(120) },
  { heal: 2, regen: 1 },
  { souls: Souls.of(180) },
  { gold: Gold.of(350) },
  { heal: 3, regen: 3 },
  { souls: Souls.of(500), gold: Gold.of(250) },
  { gold: Gold.of(1000), souls: Souls.of(800), heal: 5, regen: 5 },
];
