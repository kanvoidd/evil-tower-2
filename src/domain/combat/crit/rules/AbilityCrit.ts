import { Percent } from '../../../shared';
import type { CritRoll } from '../interfaces/CritRoll';
import type { ICritRule } from '../interfaces/ICritRule';

/** Талант: способности критуют с отдельным шансом. */
export class AbilityCrit implements ICritRule {
  constructor(private readonly chance: Percent) {}

  decide(roll: CritRoll): boolean | undefined {
    return roll.inAbility && roll.rng.chance(Percent.toRatio(this.chance)) ? true : undefined;
  }
}
