import type { CritRoll } from '../interfaces/CritRoll';
import type { ICritRule } from '../interfaces/ICritRule';

/** Первый удар героя в комнате — всегда крит. */
export class RoomOpeningCrit implements ICritRule {
  private left = 1;

  decide(_roll: CritRoll): boolean | undefined {
    if (this.left <= 0) return undefined;
    this.left--;
    return true;
  }
}
