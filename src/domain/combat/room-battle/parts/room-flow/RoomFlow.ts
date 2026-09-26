import { type AbilityDef } from '../../../../catalog';
import { type CellIndex } from '../../../../shared';
import { CombatBalance, ConsumableBalance, DeckBalance } from '../../../balance';
import { Grid } from '../../../engine/grid/Grid';
import type { GameEvent } from '../../../events';
import type { TurnResult } from '../../interfaces/TurnResult';
import { RoomPart } from '../room-part/RoomPart';

/** Течение комнаты: начало, ход героя, конец хода, выход, воскрешение, «нечем ходить». */
export class RoomFlow extends RoomPart {
  /**
   * Норма выполнена — в ближайшие карты колоды замешивается переход на следующий этаж.
   * Комната закончится только когда герой сам шагнёт на эту карту.
   */
  queueExit(): void {
    if (this.state.exitQueued || this.state.bossLeft || this.state.killsRoom < this.state.quota)
      return;
    this.state.exitQueued = true;
    const deck = this.state.engine.deck;
    deck.splice(
      this.state.rng.int(0, Math.min(DeckBalance.exitWithin, deck.length)),
      0,
      this.state.factory.createExit(),
    );
  }

  start(): GameEvent[] {
    this.state.shield = Math.round(
      this.state.stats.maxHp * (this.state.stats.startShieldPct + (this.state.mod.shieldPct ?? 0)),
    );
    for (const i of Grid.CELLS) {
      if (i === this.state.playerCell) continue;
      const card = this.state.engine.draw();
      if (!card) break;
      this.state.engine.put(i, card);
    }
    if (this.state.shield > 0) this.state.emit({ type: 'shield', now: this.state.shield });
    return this.state.engine.flush();
  }

  tap(cell: CellIndex): TurnResult {
    if (this.state.armed) return this.parts.perks.aimPerk(cell);
    const action = this.parts.actions.actionFor(cell);
    if (action.kind === 'none')
      return { ok: false, reason: action.reason, events: this.state.engine.flush() };
    this.beginTurn();
    if (action.kind === 'melee') this.parts.actions.melee(cell);
    else if (action.kind === 'ranged') this.parts.actions.basicRanged(cell);
    else this.parts.actions.collect(cell);
    this.finishTurn();
    return { ok: true, events: this.state.engine.flush() };
  }

  /** Начало хода героя. */
  beginTurn(): void {
    this.state.turnStartCell = this.state.playerCell;
    this.state.engine.resetVacated();
    this.state.engaged.clear();
    this.state.exposed = false;
    this.state.acting = true;
  }

  revive(): GameEvent[] {
    this.state.over = null;
    this.state.revived = true;
    this.state.hp = Math.max(1, Math.ceil(this.state.stats.maxHp * CombatBalance.reviveHpRatio));
    this.state.emit({ type: 'heal', amount: this.state.hp, hp: this.state.hp, source: 'revive' });
    this.breakFree();
    return this.state.engine.flush();
  }

  /** Талант «Возвращение» / «Последний шанс»: раз за забег встаём сами. */
  autoRevive(): GameEvent[] | null {
    if (this.state.reviveLeft <= 0 || this.state.stats.reviveHp <= 0) return null;
    this.state.reviveLeft--;
    this.state.selfRevived = true;
    this.state.over = null;
    this.state.hp = Math.max(1, Math.round(this.state.stats.maxHp * this.state.stats.reviveHp));
    this.state.emit({ type: 'heal', amount: this.state.hp, hp: this.state.hp, source: 'revive' });
    this.breakFree();
    return this.state.engine.flush();
  }

  /**
   * Поднявшись после растерзания, герой получает полную шкалу: иначе он встаёт в то же
   * окружение без единого хода, и «Растерзание» срабатывает второй раз в том же кадре.
   */
  private breakFree(): void {
    if (this.hasMove()) return;
    this.state.res = this.state.stats.resMax;
    this.state.emit({ type: 'resource', now: this.state.res, max: this.state.stats.resMax });
  }

  // ------------------------------------------------------------------ конец хода

  /**
   * Комната закончена: герой шагнул на карту перехода. Всё, что осталось на поле, остаётся
   * на поле — в этом и выбор: уйти сейчас или рискнуть и добрать добычу, пока лезут новые враги.
   */
  finishRoom(): void {
    if (this.state.over) return;
    this.state.over = 'win';
    this.state.emit({ type: 'win' });
  }

  /**
   * Может ли герой вообще хоть что-то сделать. Считаем и способности, и расходники:
   * зелье восстановления вернёт ману, артефакт мага разнесёт окружение.
   */
  private hasMove(): boolean {
    for (const c of Grid.CELLS) if (this.parts.actions.actionFor(c).kind !== 'none') return true;
    const usable = (p: AbilityDef): boolean => {
      if (p.target === 'self' || p.target === undefined) return true;
      for (const c of Grid.CELLS) if (this.parts.perks.perkTargetOk(p, c)) return true;
      return false;
    };
    for (const p of this.state.stats.abilities)
      if (this.parts.perks.perkReady(p).ok && usable(p)) return true;
    // расходники: зелье восстановления оживит способность, артефакт расчистит поле
    const canRefill =
      this.state.consumables.potion_regen > 0 && this.state.stats.abilities.some(usable);
    if (canRefill) return true;
    if (this.state.consumables.artifact > 0 && this.state.lineageDef.artifacts) return true;
    return false;
  }

  /**
   * Таймеры героя в конце хода: «Затаившийся стрелок» копит ходы на месте (шаг обнуляет),
   * «Ледяной доспех» отсчитывает свои ходы.
   */
  private heroTimers(): void {
    this.state.stillTurns =
      this.state.playerCell === this.state.turnStartCell ? this.state.stillTurns + 1 : 0;
    if (this.state.wardTurns > 0 && --this.state.wardTurns === 0) {
      this.state.wardDefense = 0;
      this.state.wardThorns = 0;
    }
  }

  /**
   * Доливка поля в конце хода. Капкан может поймать пришедшую карту и убить её — тогда клетку
   * доливаем сразу: в начале следующего хода освободившиеся клетки забываются, и она осталась бы
   * пустой навсегда. Каждый сработавший капкан снимается, поэтому цикл конечен.
   */
  private refillBoard(): void {
    this.state.engine.refill();
    while (this.parts.traps.springSnares() && !this.state.over) this.state.engine.refill();
  }

  /** «Заряд»: готовая, но не применённая в этом ходу способность копит силу. */
  private chargeUp(): void {
    for (const p of this.state.stats.abilities) {
      if (p.behavior !== 'ray' || !p.params.chargePer) continue;
      if (this.state.usedThisTurn.has(p.id) || this.state.cooldowns[p.id]) continue;
      const max = p.params.chargeMax ?? 1;
      this.state.charges[p.id] = Math.min(max, (this.state.charges[p.id] ?? 0) + 1);
    }
    this.state.usedThisTurn.clear();
  }

  /** Зажат ли герой: жив, бой идёт, а хода нет ни одного. */
  cornered(): boolean {
    return !this.state.over && !this.state.armed && !this.hasMove();
  }

  finishTurn(): void {
    this.state.acting = false;
    this.state.armorWorn = false;
    // враг, которого ход героя загнал в капкан, попадается раньше, чем успеет ответить
    this.parts.traps.springSnares();
    this.parts.enemyTurn.retaliate();
    if (this.state.over) return;
    this.parts.status.tickStatuses();
    this.parts.traps.tickArmed();
    this.refillBoard();
    if (this.state.over) return;
    this.heroTimers();
    this.state.totals.turns++;
    if (this.state.killsRoom === this.state.lastKills) this.state.killStreak = 0;
    this.state.lastKills = this.state.killsRoom;
    if (this.state.defTurn > 0) this.state.defTurn--;
    if (this.state.noCounter > 0) this.state.noCounter--;
    if (this.state.reaping > 0) this.state.reaping--;
    if (this.state.madness > 0) {
      this.state.madness--;
      if (this.state.madness === 0) {
        const loss = Math.max(1, Math.round(this.state.hp * this.state.paramsOf('madness').hpCost));
        this.state.hp = Math.max(1, this.state.hp - loss);
        this.state.emit({
          type: 'hit',
          cell: this.state.playerCell,
          amount: loss,
          crit: false,
          target: 'player',
          hp: this.state.hp,
        });
      }
    }
    for (const id of Object.keys(this.state.cooldowns)) {
      if (--this.state.cooldowns[id] <= 0) delete this.state.cooldowns[id];
    }
    this.chargeUp();
    const mul = this.state.boost > 0 ? ConsumableBalance.regenBoostMul : 1;
    if (this.state.boost > 0) this.state.boost--;
    if (this.state.res < this.state.stats.resMax)
      this.parts.upkeep.gain(this.state.stats.regen * mul);
    // Шкала уже восполнилась — только теперь решаем, что ходить нечем.
    if (this.cornered()) this.parts.enemyTurn.swarm();
  }
}
