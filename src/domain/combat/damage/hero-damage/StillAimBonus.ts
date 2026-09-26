import type { Ratio } from '../../../shared';
import type { DamageAcc } from '../interfaces/DamageAcc';
import type { HeroView } from '../interfaces/HeroView';
import type { IHeroDamageModifier } from '../interfaces/IHeroDamageModifier';

/** «Затаившийся стрелок»: каждый ход на месте прибавляет к урону, не больше предела стаков. */
export class StillAimBonus implements IHeroDamageModifier {
  constructor(
    private readonly perStack: Ratio,
    private readonly maxStacks: number,
  ) {}

  apply(acc: DamageAcc, hero: HeroView): void {
    acc.mul += this.perStack * Math.min(this.maxStacks, hero.stillTurns);
  }
}
