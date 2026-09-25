import type { BasicMode } from '../interfaces/BasicMode';
import type { IAttackStrategy } from '../interfaces/IAttackStrategy';

/** Рукой и ударом в спину любого врага на поле — всегда критом (наёмник). */
export class BackstabAttack implements IAttackStrategy {
  readonly melee = true;
  readonly mode: BasicMode = 'any';
  readonly mul = 1;
  readonly guaranteedCrit = true;
  readonly style = 'backstab' as const;

  reaches(): boolean {
    return true;
  }
}
