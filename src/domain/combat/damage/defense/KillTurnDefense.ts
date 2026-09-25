import type { Ratio } from '../../../shared';
import type { HeroView } from '../interfaces/HeroView';
import type { IDefenseModifier } from '../interfaces/IDefenseModifier';

/** После убийства защита выше до конца следующего хода. */
export class KillTurnDefense implements IDefenseModifier {
  constructor(private readonly share: Ratio) {}

  apply(defense: number, hero: HeroView): number {
    if (!hero.killDefenseActive) return defense;
    return Math.round(defense * (1 + this.share));
  }
}
