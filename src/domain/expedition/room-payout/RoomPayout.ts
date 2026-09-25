import type { RoomDef } from '../../catalog';
import type { BattleTotals } from '../../combat';
import { Gold, Souls } from '../../shared';
import type { RoomPay } from '../interfaces/RoomPay';

/**
 * Оплата комнаты. Пройденная комната платит всё сразу: добычу боя и бонус комнаты; до этого
 * добыча лежит в сумке и пропадает при гибели или побеге.
 */
export class RoomPayout {
  /** Что платит комната, пройденная с такими итогами боя. */
  static of(room: RoomDef, totals: BattleTotals): RoomPay {
    return {
      gold: Gold.of(totals.gold + room.clearGold),
      souls: Souls.of(totals.souls + room.clearSouls),
      flawless: totals.damageTaken === 0,
    };
  }

  /** В сумке есть добыча, которая пропадёт, если комнату не пройти. */
  static atStake(totals: BattleTotals): boolean {
    return totals.gold > 0 || totals.souls > 0;
  }
}
