import {
  ABILITY_BY_ID,
  type AbilityId,
  type ConsumableId,
  CONSUMABLES,
} from '../../../../domain/catalog';
import type { CellIndex } from '../../../../domain/shared';
import { GameCommandHandler } from '../../GameCommandHandler';
import type { ArmedPick } from '../../interfaces/ArmedPick';
import type { CellRejection } from '../../interfaces/CellRejection';
import { FlowPart } from '../flow-part/FlowPart';

/** Команды игрока в бою: способность, клетка, расходник — ход, отказ или заряд способности. */
export class PlayerMoves extends FlowPart {
  private readonly commands = new GameCommandHandler(this.d.battle);

  onPerk(id: AbilityId): void {
    if (!this.state.idle) return;
    const battle = this.d.battle;
    const res = this.commands.execute({ type: 'use-perk', abilityId: id });
    if (!res.ok) {
      this.d.view.rejectPerk(ABILITY_BY_ID[id], res.reason);
      return;
    }
    this.d.profile.markTutorial('perk');
    this.d.view.clearHand();
    // «заряжено»: ход не потрачен, ждём выбора цели
    if (battle.armed || res.events.every((e) => e.type === 'armed')) {
      this.d.view.armed(this.pickOf());
      return;
    }
    void this.parts.turns.turn(res.events);
  }

  /** Что игрок выбирает дальше: цель, вторую карту или способность для «Взведённой ловушки». */
  private pickOf(): ArmedPick {
    const armed = this.d.battle.armed;
    if (!armed) return null;
    if (armed.behavior === 'armed_trap') return this.d.battle.trapSkill ? 'one' : 'skill';
    return armed.target === 'two' ? 'two' : 'one';
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
