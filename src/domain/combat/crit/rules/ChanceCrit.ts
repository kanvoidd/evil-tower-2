import { Percent } from '../../../shared';
import type { CritRoll } from '../interfaces/CritRoll';
import type { ICritRule } from '../interfaces/ICritRule';

/** Шанс крита героя — последнее правило, решает всегда. */
export class ChanceCrit implements ICritRule {
  constructor(private readonly chance: Percent) {}

  decide(roll: CritRoll): boolean {
    return roll.rng.chance(Percent.toRatio(this.chance));
  }
}
