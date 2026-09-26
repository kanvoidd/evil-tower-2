import type { AbilityBehaviorId } from '../abilities/interfaces/AbilityBehaviorId';
import type { AbilityBehaviorParams } from '../abilities/interfaces/AbilityBehaviorParams';
import type { AbilityDef, AbilityDefOf } from '../abilities/interfaces/AbilityDef';
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

/** Пара «шанс / сила» по рангам: `chanceAndPower('basicEcho', { chance: [25], power: [60] })`. */
export const chanceAndPower = (
  fx: TalentChanceFx,
  ranks: { readonly chance: readonly number[]; readonly power: readonly number[] },
): TalentEffect => ({ kind: 'chance', fx, chance: ranks.chance, power: ranks.power });

/**
 * Правка перка по рангам: `modify(ignite, [{ burstAt: 4, burstMul: Ratio.of(1) }])` — числа ранга
 * заменяют числа способности у героя. Вид чисел проверяется по механике способности.
 */
export const modify = <B extends AbilityBehaviorId>(
  ability: AbilityDefOf<B>,
  perRank: readonly Partial<AbilityBehaviorParams[B]>[],
): TalentEffect => ({ kind: 'modify', ability: ability as AbilityDef, perRank });

/** Меняет ли талант полученные способности (значок молнии в дереве). */
export const isSynergy = (e: TalentEffect): boolean => e.kind !== 'bonus';
