import type { RoomModifier } from '../room-modifiers/interfaces/RoomModifier';
import type { RoomDef } from './RoomDef';

/**
 * Готовый «расклад» комнаты: конкретные враги, карты добычи и выпавший модификатор.
 * Всё, что зависит от случайности захода, собирается здесь — `Run` уже работает с готовыми числами.
 */
export interface RoomPlan {
  room: RoomDef;
  mod: RoomModifier;
  /** Список врагов с повторами; элитные помечены. */
  enemies: Array<{ id: string; elite: boolean }>;
  gold: number;
  chests: number;
  heal: number;
  regen: number;
}
