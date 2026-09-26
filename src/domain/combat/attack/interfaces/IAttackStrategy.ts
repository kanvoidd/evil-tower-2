import type { CellIndex } from '../../../shared';
import type { BasicMode } from './BasicMode';

/**
 * Как герой бьёт по карте без кнопки способности: рукой по соседнему врагу и базовым действием по
 * дальнему (выстрел через карту, удар в спину). Стиль называет линейка (`LineageDef.attack`) или
 * базовый перк (`AbilityDef.attack`), а стратегию по id выдаёт реестр боя `ATTACK_STRATEGIES`.
 */
export interface IAttackStrategy {
  /** Бьёт ли герой рукой соседнего врага. */
  readonly melee: boolean;
  readonly mode: BasicMode;
  /** Множитель урона базового действия. */
  readonly mul: number;
  /** Базовое действие всегда критует (удар в спину). */
  readonly guaranteedCrit: boolean;
  /** Как удар выглядит на поле. */
  readonly style: 'shot' | 'backstab';
  /** Достаёт ли базовое действие от клетки героя до клетки несоседнего врага. */
  reaches(from: CellIndex, to: CellIndex): boolean;
}
