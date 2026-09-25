import { type GameEvent, pickAutoUse } from '../../../../domain/combat';
import { FlowPart } from '../flow-part/FlowPart';

/** Ход: показать события, разобрать итог хода, применить нужный расходник сам. */
export class TurnFlow extends FlowPart {
  /** Пауза перед автоприменением: игрок успевает заметить, что предмет сработал сам. */
  static readonly AUTO_USE_PAUSE_MS = 320;

  /** Ход сделан: показать его события и разобрать итог. */
  async turn(events: GameEvent[], skipAuto = false, deal = false): Promise<void> {
    this.state.busy = true;
    this.d.tower.count(events);
    await this.d.player.play(events, { deal });
    if (this.state.alive) this.d.tower.keepConsumables();
    this.state.busy = false;
    this.afterTurn(skipAuto);
  }

  /** Автоприменение: после хода (с короткой паузой) применяет то, что действительно нужно. */
  tryAutoUse(): boolean {
    const id = pickAutoUse(this.d.battle, this.d.autoUse.config);
    if (!id) return false;
    this.state.busy = true;
    void this.d.clock.delay(TurnFlow.AUTO_USE_PAUSE_MS).then(() => {
      this.state.busy = false;
      if (!this.state.alive || this.state.finished || this.d.battle.over) return;
      this.parts.moves.onItem(id, true);
    });
    return true;
  }

  private afterTurn(skipAuto: boolean): void {
    if (!this.state.alive) return;
    this.d.view.refresh();
    const over = this.d.battle.over;
    if (over === 'win') {
      void this.parts.room.finish('win');
      return;
    }
    if (over === 'lose') {
      if (!this.parts.death.selfRevive()) void this.parts.room.finish('lose');
      return;
    }
    // подсветка врагов, которых можно добить одним ударом
    this.d.view.markKillable();
    if (!skipAuto && this.tryAutoUse()) return;
    this.parts.tutorial.update();
  }
}
