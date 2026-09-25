import type { Ratio } from '../../../shared';
import type { DamageAcc } from '../interfaces/DamageAcc';
import type { HeroView } from '../interfaces/HeroView';
import type { IHeroDamageModifier } from '../interfaces/IHeroDamageModifier';

/** Каждые сто золота в кошеле комнаты прибавляют к урону, не больше предела. */
export class GoldBonus implements IHeroDamageModifier {
  static readonly GOLD_STEP = 100;
  static readonly CAP = 0.3;

  constructor(private readonly perStep: Ratio) {}

  apply(acc: DamageAcc, hero: HeroView): void {
    acc.mul += Math.min(GoldBonus.CAP, this.perStep * Math.floor(hero.gold / GoldBonus.GOLD_STEP));
  }
}
