import { type ConsumableId, CONSUMABLES, type PerkDef } from '../../../../domain/catalog';
import type { CellIndex } from '../../../../domain/shared';
import { GameCommandHandler } from '../../GameCommandHandler';
import type { CellRejection } from '../../interfaces/CellRejection';
import { FlowPart } from '../flow-part/FlowPart';

/** Команды игрока в бою: способность, клетка, расходник — ход, отказ или заряд способности. */
export class PlayerMoves extends FlowPart {
  private readonly commands = new GameCommandHandler(this.d.battle);

  onPerk(perk: PerkDef): void {
    if (!this.state.idle) return;
    const battle = this.d.battle;
    const res = this.commands.execute({ type: 'use-perk', perkId: perk.id });
    if (!res.ok) {
      this.d.view.rejectPerk(perk, res.reason);
      return;
    }
    this.d.profile.markTutorial('perk');
    this.d.view.clearHand();
    // «заряжено»: ход не потрачен, ждём выбора цели
    if (battle.armed || res.events.every((e) => e.type === 'armed')) {
      this.d.view.armed(battle.armed ? (battle.armed.target === 'two' ? 'two' : 'one') : null);
      return;
    }
    void this.parts.turns.turn(res.events);
  }

  onCell(cell: CellIndex): void {
    if (!this.state.idle) return;
    const wasArmed = this.d.battle.armed;
    const res = this.commands.execute({ type: 'select-cell', cell });
    if (!res.ok) {
      this.d.view.rejectCell(cell, wasArmed ? 'target' : (res.reason as CellRejection));
      return;
    }
    this.d.view.clearHand();
    // первое из двух касаний «Перестановки»: ход ещё не сделан
    if (this.d.battle.armed) {
      this.d.view.firstOfTwo();
      return;
    }
    void this.parts.turns.turn(res.events);
  }

  onItem(id: ConsumableId, auto: boolean): void {
    if (!this.state.idle) return;
    const battle = this.d.battle;
    // расходник чужой линейки (артефакт не у мага) не применяется вовсе
    const lineage = CONSUMABLES[id].lineage;
    if (lineage && lineage !== battle.lineage) {
      if (!auto) this.d.view.deny();
      return;
    }
    const res = this.commands.execute({ type: 'use-item', itemId: id });
    if (!res.ok) {
      if (!auto) this.d.view.rejectItem(id === 'potion_heal' && battle.hp >= battle.stats.maxHp);
      return;
    }
    if (auto) this.d.view.autoUsed(id);
    // не больше одного автоприменения за ход: расходники не сгорают цепочкой
    void this.parts.turns.turn(res.events, auto);
  }
}
