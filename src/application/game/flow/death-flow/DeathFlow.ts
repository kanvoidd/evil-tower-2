import { FlowPart } from '../flow-part/FlowPart';

/** Гибель героя: талант «Возвращение», воскрешение за видео (одно на забег) или конец забега. */
export class DeathFlow extends FlowPart {
  /** «Возвращение» / «Последний шанс»: герой поднимается сам, без рекламы. `true` — поднялся. */
  selfRevive(): boolean {
    const up = this.d.battle.autoRevive();
    if (!up) return false;
    this.d.view.selfRevived();
    void this.parts.turns.turn(up);
    return true;
  }

  /** Окно гибели: воскрешение за видео или итог забега; недосмотренное видео возвращает окно. */
  async onDeath(): Promise<void> {
    for (;;) {
      const choice = await this.d.dialogs.died({
        canRevive: !this.d.battle.revived,
        lootLost: this.d.tower.lootAtStake,
        keepsRooms: this.d.tower.state.rooms > 0,
      });
      if (choice === 'end') {
        void this.parts.runEnd.endRun('dead');
        return;
      }
      if (await this.d.ads.rewarded()) break;
      // видео не досмотрено — окно гибели возвращается
    }
    this.state.finished = false;
    this.d.platform.gameplayStart();
    void this.parts.turns.turn(this.d.battle.revive());
  }
}
