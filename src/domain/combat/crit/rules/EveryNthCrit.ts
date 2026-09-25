import type { CritRoll } from '../interfaces/CritRoll';
import type { ICritRule } from '../interfaces/ICritRule';

/** Талант «каждый третий»: каждый `n`-й удар — крит. */
export class EveryNthCrit implements ICritRule {
  static readonly THIRD = 3;
  private count = 0;

  constructor(private readonly n: number) {}

  decide(_roll: CritRoll): boolean | undefined {
    this.count++;
    return this.count % this.n === 0 ? true : undefined;
  }
}
