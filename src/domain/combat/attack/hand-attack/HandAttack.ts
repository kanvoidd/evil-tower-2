import type { BasicMode } from '../interfaces/BasicMode';
import type { IAttackStrategy } from '../interfaces/IAttackStrategy';

/**
 * Только рукой: соседнего врага — ударом, до дальнего не достать. Так бьют все герои; дальний
 * выстрел дают базовые перки охотника, удар в спину — стиль наёмника.
 */
export class HandAttack implements IAttackStrategy {
  readonly melee = true;
  readonly mode: BasicMode = 'none';
  readonly mul = 1;
  readonly guaranteedCrit = false;
  /** Не используется: базового дальнего действия нет. */
  readonly style = 'shot' as const;

  reaches(): boolean {
    return false;
  }
}
