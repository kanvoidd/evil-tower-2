import { type RoomDef, ROOMS } from '../../catalog';
import type { BattleCarryStats } from '../../combat';
import { Gold, Souls } from '../../shared';
import type { RoomPay } from '../interfaces/RoomPay';
import type { RunCarry } from '../interfaces/RunCarry';

/**
 * Подъём по башне: забег всегда начинается с 1-1 и идёт по комнатам башни по порядку. Здоровье,
 * ресурс и истраченные воскрешения героя переходят в следующую комнату, заработанное копится.
 */
export class TowerClimb {
  /** Сколько комнат в башне. */
  static get length(): number {
    return ROOMS.length;
  }

  /** Новый забег с 1-1; рекорд героя запоминается, чтобы в конце сказать «новый рекорд». */
  static start(best: number): RunCarry {
    return { index: 0, rooms: 0, gold: Gold.of(0), souls: Souls.of(0), best };
  }

  /** Комната, в которую герой входит; после вершины — последняя комната башни. */
  static room(carry: RunCarry): RoomDef {
    return ROOMS[Math.min(carry.index, ROOMS.length - 1)];
  }

  /** Вся башня пройдена. */
  static complete(carry: RunCarry): boolean {
    return carry.index >= ROOMS.length;
  }

  /** Номер следующей комнаты («2-1»). */
  static nextRoomId(carry: RunCarry): string {
    return ROOMS[carry.index].id;
  }

  /** Комната пройдена: дальше — следующая, с тем, что герой вынес из этой. */
  static advance(carry: RunCarry, pay: RoomPay, hero: BattleCarryStats): RunCarry {
    return {
      ...carry,
      index: carry.index + 1,
      rooms: carry.rooms + 1,
      gold: Gold.of(carry.gold + pay.gold),
      souls: Souls.of(carry.souls + pay.souls),
      hero,
    };
  }
}
