/** Место перка в классе с ярусами: стартовый, второй, третий, легендарный. */
export type TieredPerkSlot = 'start' | 'p2' | 'p3' | 'legend';

/** Место перка в ветке класса: `<ветка>-<номер шага с единицы>` (`fire-1`). */
export type BranchPerkSlot = `${string}-${number}`;

export type PerkSlot = TieredPerkSlot | BranchPerkSlot;
