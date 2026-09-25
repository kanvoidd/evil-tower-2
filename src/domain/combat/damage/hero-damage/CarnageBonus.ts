import type { Ratio } from '../../../shared';
import type { DamageAcc } from '../interfaces/DamageAcc';
import type { HeroView } from '../interfaces/HeroView';
import type { IHeroDamageModifier } from '../interfaces/IHeroDamageModifier';

/** «Резня»: убийства подряд копят надбавку к урону до предела. */
export class CarnageBonus implements IHeroDamageModifier {
  constructor(
    private readonly perKill: Ratio,
    private readonly cap: Ratio,
  ) {}

  apply(acc: DamageAcc, hero: HeroView): void {
    acc.mul += Math.min(this.cap, this.perKill * hero.killStreak);
  }
}
