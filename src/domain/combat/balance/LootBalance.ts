import { Ratio } from '../../shared';

/** Добыча боя: что, кроме золота, выпадает из сундука. */
export const LootBalance = {
  /** Шанс, что сундук даст расходник (удача героя добавляет к нему). */
  chestItemChance: Ratio.of(0.35),
  /** Шанс второго расходника сверху. */
  chestBonusItemChance: Ratio.of(0.08),
} as const;
