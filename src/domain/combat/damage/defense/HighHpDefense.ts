import type { Ratio } from '../../../shared';
import type { HeroView } from '../interfaces/HeroView';
import type { IDefenseModifier } from '../interfaces/IDefenseModifier';

/** Пока здоровья больше порога, защита выше. */
export class HighHpDefense implements IDefenseModifier {
  static readonly HP_SHARE = 0.7;

  constructor(private readonly share: Ratio) {}

  apply(defense: number, hero: HeroView): number {
    if (hero.hp <= hero.maxHp * HighHpDefense.HP_SHARE) return defense;
    return Math.round(defense * (1 + this.share));
  }
}
