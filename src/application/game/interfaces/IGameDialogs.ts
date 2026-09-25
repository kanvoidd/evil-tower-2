import type { RoomClearSummary } from './RoomClearSummary';
import type { RunSummary } from './RunSummary';

/**
 * Решения игрока в модальных окнах боя. Каждое окно отвечает промисом — выбором игрока,
 * поэтому поток забега читается сверху вниз, без вложенных колбэков.
 */
export interface IGameDialogs {
  /** «Завершить забег?» — true, если игрок уходит. */
  confirmEscape(o: { keepsRooms: boolean; lootAtStake: boolean }): Promise<boolean>;
  /** Между комнатами: идти выше или уйти с наградой. */
  roomCleared(o: RoomClearSummary): Promise<'next' | 'cashout'>;
  /** Герой погиб: воскреснуть за видео (если ещё можно) или закончить забег. */
  died(o: {
    canRevive: boolean;
    lootLost: boolean;
    keepsRooms: boolean;
  }): Promise<'revive' | 'end'>;
  /**
   * Итог забега. `double` вызывается кнопкой «Удвоить награду» и отвечает, выдана ли награда;
   * окно остаётся открытым до выбора, куда идти дальше.
   */
  runOver(o: RunSummary, double: () => Promise<boolean>): Promise<'new-run' | 'hub'>;
}
