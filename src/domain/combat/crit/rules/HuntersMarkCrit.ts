import type { CritRoll } from '../interfaces/CritRoll';
import type { ICritRule } from '../interfaces/ICritRule';

/** «Метка охотника»: первый выстрел по неповреждённому врагу — всегда крит. */
export class HuntersMarkCrit implements ICritRule {
  decide(roll: CritRoll): boolean | undefined {
    return roll.ranged && roll.enemy && roll.enemy.hits === 0 ? true : undefined;
  }
}
