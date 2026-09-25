import type { Ratio } from '../../../shared';
import type { DamageAcc } from '../interfaces/DamageAcc';
import type { HeroView } from '../interfaces/HeroView';
import type { IHeroDamageModifier } from '../interfaces/IHeroDamageModifier';

/** Пока здоровья не больше половины, урон выше. */
export class RageBonus implements IHeroDamageModifier {
  /** Порог здоровья — доля максимума. */
  static readonly HP_SHARE = 0.5;

  constructor(private readonly share: Ratio) {}

  apply(acc: DamageAcc, hero: HeroView): void {
    if (hero.hp <= hero.maxHp * RageBonus.HP_SHARE) acc.mul += this.share;
  }
}
