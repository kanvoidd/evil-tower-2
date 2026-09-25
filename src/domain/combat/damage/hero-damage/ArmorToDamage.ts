import type { Ratio } from '../../../shared';
import type { DamageAcc } from '../interfaces/DamageAcc';
import type { HeroView } from '../interfaces/HeroView';
import type { IHeroDamageModifier } from '../interfaces/IHeroDamageModifier';

/** Доля защиты героя добавляется к базовому урону. */
export class ArmorToDamage implements IHeroDamageModifier {
  constructor(private readonly share: Ratio) {}

  apply(acc: DamageAcc, hero: HeroView): void {
    acc.base += Math.round(hero.defense() * this.share);
  }
}
