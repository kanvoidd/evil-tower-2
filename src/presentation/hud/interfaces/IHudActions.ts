import type { PlayerCommand } from '../../../application/game/interfaces/PlayerCommand';
import type { ConsumableId } from '../../../domain/catalog';

/**
 * Что HUD может попросить. Кнопки панели не трогают бой — они отдают команду игрока,
 * а решение принимает тот, кто её получил.
 */
export interface IHudActions {
  /** Кнопка способности, расходника или «Сбежать». */
  command(cmd: PlayerCommand): void;
  /** Включено ли автоприменение расходника. */
  isAutoOn(item: ConsumableId): boolean;
  /** Переключить автоприменение; возвращает новое состояние. */
  toggleAuto(item: ConsumableId): boolean;
}
