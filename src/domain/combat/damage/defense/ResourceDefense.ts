import type { Ratio } from '../../../shared';
import type { HeroView } from '../interfaces/HeroView';
import type { IDefenseModifier } from '../interfaces/IDefenseModifier';

/** Пока шкала ресурса заполнена больше чем наполовину, защита выше. */
export class ResourceDefense implements IDefenseModifier {
  static readonly RES_SHARE = 0.5;

  constructor(private readonly share: Ratio) {}

  apply(defense: number, hero: HeroView): number {
    if (hero.res <= hero.resMax * ResourceDefense.RES_SHARE) return defense;
    return Math.round(defense * (1 + this.share));
  }
}
