import type { Ratio } from '../../../shared';
import type { HeroView } from '../interfaces/HeroView';
import type { IDefenseModifier } from '../interfaces/IDefenseModifier';

/** Каждое убийство в комнате прибавляет к защите, не больше предела. */
export class KillStackDefense implements IDefenseModifier {
  static readonly CAP = 0.2;

  constructor(private readonly perKill: Ratio) {}

  apply(defense: number, hero: HeroView): number {
    const bonus = Math.min(KillStackDefense.CAP, this.perKill * hero.killsRoom);
    return Math.round(defense * (1 + bonus));
  }
}
