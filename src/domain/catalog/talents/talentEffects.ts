import type { TalentBonusFx } from './interfaces/TalentBonusFx';
import type { TalentChanceFx } from './interfaces/TalentChanceFx';
import type { TalentEffect } from './interfaces/TalentEffect';
import type { TalentSynergyFx } from './interfaces/TalentSynergyFx';

/** Прибавка по рангам (суммарная): `bonus('crit', [3, 6])` — «+3% → +6% к шансу крита». */
export const bonus = (fx: TalentBonusFx, perRank: readonly number[]): TalentEffect => ({
  kind: 'bonus',
  fx,
  perRank,
});

/** Синергия по рангам (суммарная): меняет уже полученные способности. */
export const synergy = (fx: TalentSynergyFx, perRank: readonly number[]): TalentEffect => ({
  kind: 'synergy',
  fx,
  perRank,
});

/** Пара «шанс / сила» по рангам: `chanceAndPower('boltEcho', { chance: [15, 30], power: [50, 70] })`. */
export const chanceAndPower = (
  fx: TalentChanceFx,
  ranks: { readonly chance: readonly number[]; readonly power: readonly number[] },
): TalentEffect => ({ kind: 'chance', fx, chance: ranks.chance, power: ranks.power });

/** Меняет ли талант полученные способности (значок молнии в дереве). */
export const isSynergy = (e: TalentEffect): boolean => e.kind !== 'bonus';
