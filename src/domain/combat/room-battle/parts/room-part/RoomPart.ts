import type { RoomState } from '../../room-state/RoomState';
import type { RoomParts } from '../interfaces/RoomParts';

/**
 * Часть боя в комнате. Все части работают над одним состоянием комнаты и зовут друг друга
 * по имени (`this.parts.hits.damageEnemy(…)`), поэтому видно, какое правило чем пользуется.
 */
export abstract class RoomPart {
  constructor(
    protected readonly state: RoomState,
    protected readonly parts: RoomParts,
  ) {}
}
