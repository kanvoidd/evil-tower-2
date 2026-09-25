import type { AbilityId } from '../../../catalog';
import type { CellIndex } from '../../../shared';
import type { BasicMode } from './BasicMode';

/**
 * Как герой линейки бьёт по карте без кнопки способности: рукой по соседнему врагу и базовым
 * действием по дальнему (выстрел через карту, удар в спину). Это стиль боя линейки — у всех её
 * классов он один: фабрика героя называет его по id (`LineageDef.attack`), а стратегию по id выдаёт
 * реестр боя `ATTACK_STRATEGIES`.
 */
export interface IAttackStrategy {
  /** Бьёт ли герой рукой соседнего врага. У мага — нет: его удар — заклинание по кнопке. */
  readonly melee: boolean;
  readonly mode: BasicMode;
  /** Множитель урона базового действия. */
  readonly mul: number;
  /** Базовое действие всегда критует (удар в спину). */
  readonly guaranteedCrit: boolean;
  /** Как удар выглядит на поле. */
  readonly style: 'shot' | 'backstab' | 'bolt';
  /** Достаёт ли базовое действие от клетки героя до клетки несоседнего врага. */
  reaches(from: CellIndex, to: CellIndex, passives: ReadonlySet<AbilityId>): boolean;
}
