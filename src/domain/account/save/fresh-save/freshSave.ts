import { DEFAULT_AUTO_USE } from '../../../combat';
import type { Lang } from '../../../shared';
import type { SaveData } from '../interfaces/SaveData';
import { PROFESSION_TREES } from '../migrations/profession-rework/professionTrees';

/** Документ сохранения нового игрока. */
export const freshSave = (lang: Lang, now: number): SaveData => ({
  v: 2,
  treeVersion: PROFESSION_TREES,
  savedAt: 0,
  createdAt: now,
  lang,
  volume: 0.7,
  muted: false,
  activeClass: null,
  lineages: {},
  weapon: {},
  heroes: {},
  stats: {
    kills: 0,
    goldEarned: 0,
    soulsEarned: 0,
    roomsCleared: 0,
    deaths: 0,
    chestsOpened: 0,
    metamorphoses: 0,
    flawless: 0,
    itemsBroken: 0,
  },
  achievements: [],
  daily: { lastClaim: '', streak: 0 },
  gift: { readyAt: 0 },
  tutorial: { fight: false, hub: false, skill: false, shop: false, perk: false },
  ads: { lastInterstitial: 0, runsSinceAd: 0 },
  auto: { use: { ...DEFAULT_AUTO_USE }, skill: {} },
  reviewAsked: false,
});
