import { type ConsumableId } from '../../../../catalog';
import type { BattleTotals } from '../../interfaces/BattleTotals';
import { RoomPart } from '../room-part/RoomPart';

/** «Откат времени»: снимок начала хода и возврат к нему. */
export class Rewind extends RoomPart {
  // ------------------------------------------------------------------ откат времени

  takeSnapshot(): void {
    if (!this.state.stats.allAbilities.some((a) => a.behavior === 'rewind')) return;
    this.state.snapshot = {
      engine: this.state.engine.capture(),
      hp: this.state.hp,
      shield: this.state.shield,
      res: this.state.res,
      totals: JSON.stringify(this.state.totals),
      consumables: JSON.stringify(this.state.consumables),
      flags: JSON.stringify([
        this.state.killsRoom,
        this.state.killStreak,
        this.state.noCounter,
        this.state.madness,
        this.state.reaping,
        this.state.warCry,
      ]),
    };
  }

  restoreSnapshot(): void {
    const s = this.state.snapshot;
    if (!s) return;
    this.state.engine.restore(s.engine);
    this.state.hp = s.hp;
    this.state.shield = s.shield;
    this.state.res = s.res;
    this.state.totals = JSON.parse(s.totals) as BattleTotals;
    this.state.consumables = JSON.parse(s.consumables) as Record<ConsumableId, number>;
    const f = JSON.parse(s.flags) as number[];
    [
      this.state.killsRoom,
      this.state.killStreak,
      this.state.noCounter,
      this.state.madness,
      this.state.reaping,
      this.state.warCry,
    ] = f;
    this.state.snapshot = null;
    this.state.over = null;
  }
}
