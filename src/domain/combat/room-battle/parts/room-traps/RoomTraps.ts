import type { AbilityDef } from '../../../../catalog';
import type { CellIndex } from '../../../../shared';
import type { TrapState } from '../../interfaces/TrapState';
import { RoomPart } from '../room-part/RoomPart';

/**
 * Ловушки на клетках поля: «Капкан» срабатывает, когда на клетку попадает враг (новая карта из
 * колоды, сдвиг, перестановка); «Взведённая ловушка» отсчитывает ходы и применяет выбранную
 * способность к своей клетке.
 */
export class RoomTraps extends RoomPart {
  /** Стоит ли на клетке ловушка. */
  hasTrap(cell: CellIndex): boolean {
    return this.state.traps.some((t) => t.cell === cell);
  }

  /** Поставить «Капкан» на клетку. */
  placeSnare(cell: CellIndex, ability: AbilityDef): void {
    this.add({ cell, ability, armed: false, turns: 0, fresh: true });
  }

  /** Поставить «Взведённую ловушку»: способность `ability` сработает на клетке через `turns` ходов. */
  placeArmed(cell: CellIndex, ability: AbilityDef, turns: number): void {
    this.add({ cell, ability, armed: true, turns, fresh: true });
  }

  /** Капканы, на клетках которых оказался враг, срабатывают: урон и оглушение. */
  springSnares(): void {
    for (const t of [...this.state.traps]) {
      if (this.state.over) return;
      if (t.armed || this.state.cards[t.cell]?.kind !== 'enemy') continue;
      this.remove(t);
      if (t.ability.behavior !== 'trap') continue;
      const { dmg, stun } = t.ability.params;
      this.state.emit({ type: 'cast', ability: t.ability.id, cells: [t.cell] });
      this.parts.status.applyStun(t.cell, stun);
      this.parts.hits.strike(t.cell, this.parts.damage.spellDamage(dmg), false);
    }
  }

  /** Взведённые ловушки отсчитывают ход; дошла до нуля — способность срабатывает на клетке. */
  tickArmed(): void {
    for (const t of [...this.state.traps]) {
      if (this.state.over) return;
      if (!t.armed) continue;
      if (t.fresh) {
        t.fresh = false;
        continue;
      }
      t.turns--;
      if (t.turns > 0) {
        this.state.emit({
          type: 'trap',
          cell: t.cell,
          ability: t.ability.id,
          turns: t.turns,
          on: true,
        });
        continue;
      }
      this.remove(t);
      this.parts.perks.castDelayed(t.ability, t.cell);
    }
  }

  private add(t: TrapState): void {
    this.state.traps.push(t);
    this.state.emit({
      type: 'trap',
      cell: t.cell,
      ability: t.ability.id,
      turns: t.turns,
      on: true,
    });
  }

  private remove(t: TrapState): void {
    this.state.traps = this.state.traps.filter((x) => x !== t);
    this.state.emit({ type: 'trap', cell: t.cell, ability: t.ability.id, turns: 0, on: false });
  }
}
