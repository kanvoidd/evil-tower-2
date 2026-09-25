import type { Ratio } from '../../../shared';
import type { DamageAcc } from '../interfaces/DamageAcc';
import type { HeroView } from '../interfaces/HeroView';
import type { IHeroDamageModifier } from '../interfaces/IHeroDamageModifier';

/** Каждое убийство в комнате прибавляет к урону, не больше предела. */
export class KillBonus implements IHeroDamageModifier {
  static readonly CAP = 0.3;

  constructor(private readonly perKill: Ratio) {}

  apply(acc: DamageAcc, hero: HeroView): void {
    acc.mul += Math.min(KillBonus.CAP, this.perKill * hero.killsRoom);
  }
}
