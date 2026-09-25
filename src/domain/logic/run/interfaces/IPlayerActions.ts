import type { ConsumableId } from '../../../types';
import type { GameEvent } from '../../../game-data/events';
import type { TurnResult } from './TurnResult';

/**
 * Всё, что может сделать игрок в бою. Сцена знает только эти действия: как они
 * разыгрываются на поле, решают правила и движок.
 */
export interface IPlayerActions {
  /** Войти в комнату: на поле ложатся первые карты. */
  start(): GameEvent[];
  /** Нажатие на клетку: удар, выстрел, шаг, подбор — или наведение заряженной способности. */
  tap(cell: number): TurnResult;
  /** Кнопка способности: применить сразу или зарядить (повторное нажатие снимает заряд). */
  usePerk(id: string): TurnResult;
  cancelPerk(): GameEvent[];
  useItem(id: ConsumableId): TurnResult;
  /** Воскрешение за рекламу. */
  revive(): GameEvent[];
  /** Талант «Возвращение»: раз за забег герой встаёт сам; null — не сработал. */
  autoRevive(): GameEvent[] | null;
}
