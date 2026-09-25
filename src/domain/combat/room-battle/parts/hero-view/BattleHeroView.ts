import type { Gold } from '../../../../shared';
import type { HeroView } from '../../../damage';
import type { RoomState } from '../../room-state/RoomState';
import type { RoomParts } from '../interfaces/RoomParts';

/** Герой глазами правил урона и защиты — живые значения этого боя. */
export class BattleHeroView implements HeroView {
  constructor(
    private readonly state: RoomState,
    private readonly parts: RoomParts,
  ) {}

  get hp(): number {
    return this.state.hp;
  }

  get maxHp(): number {
    return this.state.stats.maxHp;
  }

  get res(): number {
    return this.state.res;
  }

  get resMax(): number {
    return this.state.stats.resMax;
  }

  get killsRoom(): number {
    return this.state.killsRoom;
  }

  get killStreak(): number {
    return this.state.killStreak;
  }

  get gold(): Gold {
    return this.state.totals.gold;
  }

  get killDefenseActive(): boolean {
    return this.state.defTurn > 0;
  }

  defense(): number {
    return this.parts.damage.defenseNow();
  }
}
