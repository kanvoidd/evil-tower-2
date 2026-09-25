import type { TalentBonusFx } from './TalentBonusFx';
import type { TalentChanceFx } from './TalentChanceFx';
import type { TalentSynergyFx } from './TalentSynergyFx';

/**
 * Что даёт талант — эффект по рангам. Значения по рангам СУММАРНЫЕ: [20, 30, 40] значит
 * «+20% → +30% → +40%»; число рангов — длина списка. Записывается помощниками `bonus`, `synergy`
 * и `chanceAndPower`.
 */
export type TalentEffect =
  /** Прибавка к характеристике или правилу героя; у нескольких талантов — складывается. */
  | { readonly kind: 'bonus'; readonly fx: TalentBonusFx; readonly perRank: readonly number[] }
  /** Меняет уже полученные способности; у нескольких талантов — складывается. */
  | { readonly kind: 'synergy'; readonly fx: TalentSynergyFx; readonly perRank: readonly number[] }
  /**
   * Пара «шанс / сила»: шансы нескольких талантов складываются, а сила берётся наибольшая — это
   * одна и та же механика, и складывать её силу от двух классов линейки было бы неверно.
   */
  | {
      readonly kind: 'chance';
      readonly fx: TalentChanceFx;
      readonly chance: readonly number[];
      readonly power: readonly number[];
    };
