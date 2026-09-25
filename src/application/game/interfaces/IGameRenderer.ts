import type { AbilityDef, ConsumableId } from '../../../domain/catalog';
import type { CellRejection } from './CellRejection';
import type { TutorialStep } from './TutorialStep';

/**
 * Что контроллер боя показывает игроку, кроме проигрывания событий и модальных окон:
 * состояние после хода, отказ в действии, заряд способности, подсказки обучения.
 * Реализация читает бой сама — контроллер лишь говорит, что показать.
 */
export interface IGameRenderer {
  /** Панели и поле — по бою после хода. */
  refresh(): void;
  /** Рамка «добьёт одним ударом» у врагов. */
  markKillable(): void;
  /** Способность не применилась (перезарядка, нет ресурса, уже действует, раз за комнату). */
  rejectPerk(perk: AbilityDef, reason: string | undefined): void;
  /** Касание клетки не стало ходом. */
  rejectCell(cell: number, reason: CellRejection): void;
  /** Расходник не применился; `hpFull` — лечить некого. */
  rejectItem(hpFull: boolean): void;
  /** Действие запрещено без пояснений (например, чужой расходник). */
  deny(): void;
  /** Заряд способности изменился: `one`/`two` — ждём одну или две цели, `null` — заряд снят. */
  armed(pick: 'one' | 'two' | null): void;
  /** Первое из двух касаний «Перестановки»: ход ещё не сделан. */
  firstOfTwo(): void;
  /** Расходник применился сам. */
  autoUsed(item: ConsumableId): void;
  /** Талант «Возвращение» поднял героя. */
  selfRevived(): void;
  /** Звук исхода комнаты. */
  outcome(result: 'win' | 'lose'): void;
  tutorial(step: TutorialStep, cell?: number): void;
  /** Игрок сделал то, на что указывал палец. */
  clearHand(): void;
  clearTutorial(): void;
}
