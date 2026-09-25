import type { Ratio } from '../../../shared';
import type { HeroView } from '../interfaces/HeroView';
import type { IDefenseModifier } from '../interfaces/IDefenseModifier';

/** «Шрамы»: за каждую потерянную долю здоровья (шаг) защита выше. */
export class ScarDefense implements IDefenseModifier {
  /** Шаг потерянного здоровья — доля максимума. */
  static readonly HP_STEP = 0.2;

  constructor(private readonly perStep: Ratio) {}

  apply(defense: number, hero: HeroView): number {
    const lost = Math.floor((1 - hero.hp / hero.maxHp) / ScarDefense.HP_STEP);
    return Math.round(defense * (1 + this.perStep * lost));
  }
}
