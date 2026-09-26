import type { RunEndReason } from '../../interfaces/RunEndReason';
import { FlowPart } from '../flow-part/FlowPart';

/** Конец забега: побег с подтверждением, итог, рекорд, удвоение награды и куда идти дальше. */
export class RunEnd extends FlowPart {
  async askEscape(): Promise<void> {
    if (this.state.finished) return;
    const tower = this.d.tower;
    const leave = await this.d.dialogs.confirmEscape({
      keepsRooms: tower.state.rooms > 0,
      lootAtStake: tower.lootAtStake,
    });
    if (leave) void this.endRun('escape');
  }

  /** Итог, рекорд и автопрокачка на заработанные души — один раз за забег. */
  async endRun(reason: RunEndReason): Promise<void> {
    if (this.state.ended) return;
    this.state.ended = true;
    this.state.finished = true;
    this.d.platform.gameplayStop();
    const tower = this.d.tower;
    const lootLost = (reason === 'dead' || reason === 'escape') && tower.lootAtStake;
    const { record, best } = tower.end(reason);
    this.d.view.clearTutorial();
    const c = tower.state;
    const choice = await this.d.dialogs.runOver(
      {
        reason,
        rooms: c.rooms,
        maxRooms: tower.maxRooms,
        record,
        best,
        gold: c.gold,
        souls: c.souls,
        lootLost,
        canDouble: c.gold + c.souls > 0,
      },
      () => this.doubleReward(),
    );
    const room = this.parts.room;
    if (choice === 'new-run') void room.leave(() => this.d.navigator.newRun());
    else void room.leave(() => this.d.navigator.toHub());
  }

  /** «Удвоить награду» за видео: весь забег ещё раз. */
  private async doubleReward(): Promise<boolean> {
    if (!(await this.d.ads.rewarded())) return false;
    this.d.tower.doubleReward();
    return true;
  }
}
