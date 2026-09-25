import { FlowPart } from '../flow-part/FlowPart';

/** Конец комнаты: победа и выбор между комнатами, гибель, уход из боя. */
export class RoomOutcome extends FlowPart {
  /** Пауза после гибели и после победы в комнате — перед окном и переходом. */
  static readonly LOSE_PAUSE_MS = 500;
  static readonly WIN_PAUSE_MS = 700;

  async finish(result: 'win' | 'lose'): Promise<void> {
    // конец хода может прийти дважды (например, два обработчика итога хода) — награда платится один раз
    if (this.state.finished) return;
    this.state.finished = true;
    this.d.platform.gameplayStop();
    this.d.view.clearTutorial();
    if (result === 'lose') {
      this.d.view.outcome('lose');
      await this.d.clock.delay(RoomOutcome.LOSE_PAUSE_MS);
      if (this.state.alive) void this.parts.death.onDeath();
      return;
    }
    await this.win();
  }

  /** Уход из боя — логическая пауза: здесь уместна полноэкранная реклама. */
  async leave(go: () => void): Promise<void> {
    this.state.finished = true;
    this.d.tower.leave();
    await this.d.ads.interstitial();
    go();
  }

  private async win(): Promise<void> {
    const tower = this.d.tower;
    const paid = tower.clearRoom();
    this.d.view.outcome('win');
    await this.d.clock.delay(RoomOutcome.WIN_PAUSE_MS);
    if (!this.state.alive) return;
    if (tower.complete) {
      void this.parts.runEnd.endRun('complete');
      return;
    }
    // между комнатами: что принесла эта, сколько здоровья осталось — и решение, идти ли выше
    const choice = await this.d.dialogs.roomCleared({
      ...paid,
      hp: this.d.battle.hp,
      maxHp: this.d.battle.stats.maxHp,
      rooms: tower.state.rooms,
      nextRoomId: tower.nextRoomId,
    });
    if (choice === 'next') void this.leave(() => this.d.navigator.nextRoom(tower.state));
    else void this.parts.runEnd.endRun('cashout');
  }
}
