import type { BasicMode } from '../interfaces/BasicMode';
import type { IAttackStrategy } from '../interfaces/IAttackStrategy';

/**
 * Рукой не бьёт вовсе: единственный удар — заклинание по кнопке (маг, «Удар молнии» за ману).
 * Касание соседнего врага подсказывает, что нужна кнопка, и не тратит ход.
 */
export class SpellAttack implements IAttackStrategy {
  readonly melee = false;
  readonly mode: BasicMode = 'none';
  readonly mul = 1;
  readonly guaranteedCrit = false;
  /** Не используется: молния — способность, а не базовое действие. */
  readonly style = 'bolt' as const;

  reaches(): boolean {
    return false;
  }
}
