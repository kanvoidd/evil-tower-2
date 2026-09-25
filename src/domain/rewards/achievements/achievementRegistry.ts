import type { AchievementDef } from './interfaces/AchievementDef';
import type { AchievementFacts } from './interfaces/AchievementFacts';
import type { PlayerCounters } from './interfaces/PlayerCounters';

const count =
  (key: keyof PlayerCounters) =>
  (s: AchievementFacts): number =>
    s.stats[key];
// Достижения общие на профиль: этаж считается взятым, если хоть один герой прошёл его за один забег
// (в этаже пять комнат, рекорд героя — сколько комнат подряд он прошёл).
const floorCleared =
  (f: number) =>
  (s: AchievementFacts): number =>
    Object.values(s.heroes).some((h) => (h?.best ?? 0) >= f * 5) ? 1 : 0;

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_blood',
    target: 1,
    progress: count('kills'),
  },
  {
    id: 'slayer',
    target: 100,
    progress: count('kills'),
  },
  {
    id: 'exterminator',
    target: 1000,
    progress: count('kills'),
  },
  {
    id: 'rich',
    target: 1000,
    progress: count('goldEarned'),
  },
  {
    id: 'tycoon',
    target: 50000,
    progress: count('goldEarned'),
  },
  {
    id: 'soul_collector',
    target: 1000,
    progress: count('soulsEarned'),
  },
  {
    id: 'soul_hoarder',
    target: 100000,
    progress: count('soulsEarned'),
  },
  {
    id: 'chest_finder',
    target: 25,
    progress: count('chestsOpened'),
  },
  {
    id: 'rooms_10',
    target: 10,
    progress: count('roomsCleared'),
  },
  {
    id: 'rooms_50',
    target: 50,
    progress: count('roomsCleared'),
  },
  {
    id: 'floor_1',
    target: 1,
    floor: 1,
    progress: floorCleared(1),
  },
  {
    id: 'floor_2',
    target: 1,
    floor: 2,
    progress: floorCleared(2),
  },
  {
    id: 'floor_3',
    target: 1,
    floor: 3,
    progress: floorCleared(3),
  },
  {
    id: 'floor_5',
    target: 1,
    floor: 5,
    progress: floorCleared(5),
  },
  {
    id: 'floor_7',
    target: 1,
    floor: 7,
    progress: floorCleared(7),
  },
  {
    id: 'floor_10',
    target: 1,
    floor: 10,
    progress: floorCleared(10),
  },
  {
    id: 'flawless',
    target: 1,
    progress: count('flawless'),
  },
  {
    id: 'metamorphosis',
    target: 1,
    progress: count('metamorphoses'),
  },
  {
    id: 'unbreakable',
    target: 3,
    progress: count('itemsBroken'),
  },
];
