import { type ConsumableId, CONSUMABLES, PERK_BY_ID, type PerkDef } from '../../domain/catalog';
import { type GameEvent, Grid, type IBattleSession, pickAutoUse } from '../../domain/combat';
import type { CellIndex } from '../../domain/shared';
import { GameCommandHandler } from './GameCommandHandler';
import type { CellRejection } from './interfaces/CellRejection';
import type { GameControllerDeps } from './interfaces/GameControllerDeps';
import type { PlayerCommand } from './interfaces/PlayerCommand';
import type { RunEndReason } from './interfaces/RunEndReason';

/**
 * Поток боя в комнате: принять команду игрока, дать бою её разыграть, показать события,
 * разобрать итог хода — победа, гибель, автоприменение, обучение — и довести забег до конца.
 *
 *   GameScene → GameController → GameCommandHandler → RoomBattle → Engine
 *                              → IAnimationPlayer / IGameRenderer / IGameDialogs
 *
 * Правил боя контроллер не знает (их решает `RoomBattle`), Phaser не знает (он за интерфейсами),
 * а всё, что забег оставляет в профиле, пишет `TowerRun`.
 */
export class GameController {
  /** Бой в комнате — открыт для чтения (отладка, проверки). */
  readonly battle: IBattleSession;
  private readonly commands: GameCommandHandler;
  private busy = false;
  private alive = true;
  private finished = false;
  /** Забег уже подведён — итог и рекорд пишутся один раз. */
  private ended = false;
  private hintStage = 0;

  constructor(private readonly d: GameControllerDeps) {
    this.battle = d.battle;
    this.commands = new GameCommandHandler(d.battle);
    d.input.onCommand((cmd) => this.execute(cmd));
  }

  /** Вход в комнату: на поле ложатся первые карты. */
  start(): void {
    this.d.platform.gameplayStart();
    void this.turn(this.battle.start(), false, true);
  }

  /** Сцена закрылась: недоигранное не продолжаем. */
  dispose(): void {
    this.alive = false;
    this.d.platform.gameplayStop();
  }

  /**
   * Команда игрока. Ввод (поле, клавиши, кнопки панелей) только сообщает намерение;
   * что из него выйдет, решает бой через обработчик команд.
   */
  execute(cmd: PlayerCommand): void {
    switch (cmd.type) {
      case 'select-cell':
        return this.onCell(cmd.cell);
      case 'use-perk':
        return this.onPerk(PERK_BY_ID[cmd.perkId]);
      case 'use-item':
        return this.onItem(cmd.itemId, !!cmd.auto);
      case 'escape':
        return void this.askEscape();
    }
  }

  /** Переключатель «АВТО»: если ситуация уже подходит — сработает сразу, не дожидаясь следующего хода. */
  toggleAuto(item: ConsumableId): boolean {
    const on = this.d.autoUse.toggle(item);
    if (on && this.idle) this.tryAutoUse();
    return on;
  }

  private get idle(): boolean {
    return !this.busy && !this.finished && !this.battle.over;
  }

  // ------------------------------------------------------------------ команды

  private onPerk(perk: PerkDef): void {
    if (!this.idle) return;
    const res = this.commands.execute({ type: 'use-perk', perkId: perk.id });
    if (!res.ok) {
      this.d.view.rejectPerk(perk, res.reason);
      return;
    }
    this.d.profile.markTutorial('perk');
    this.d.view.clearHand();
    // «заряжено»: ход не потрачен, ждём выбора цели
    if (this.battle.armed || res.events.every((e) => e.type === 'armed')) {
      this.d.view.armed(
        this.battle.armed ? (this.battle.armed.target === 'two' ? 'two' : 'one') : null,
      );
      return;
    }
    void this.turn(res.events);
  }

  private onCell(cell: CellIndex): void {
    if (!this.idle) return;
    const wasArmed = this.battle.armed;
    const res = this.commands.execute({ type: 'select-cell', cell });
    if (!res.ok) {
      this.d.view.rejectCell(cell, wasArmed ? 'target' : (res.reason as CellRejection));
      return;
    }
    this.d.view.clearHand();
    // первое из двух касаний «Перестановки»: ход ещё не сделан
    if (this.battle.armed) {
      this.d.view.firstOfTwo();
      return;
    }
    void this.turn(res.events);
  }

  private onItem(id: ConsumableId, auto: boolean): void {
    if (!this.idle) return;
    // расходник чужой линейки (артефакт не у мага) не применяется вовсе
    const lineage = CONSUMABLES[id].lineage;
    if (lineage && lineage !== this.battle.lineage) {
      if (!auto) this.d.view.deny();
      return;
    }
    const res = this.commands.execute({ type: 'use-item', itemId: id });
    if (!res.ok) {
      if (!auto)
        this.d.view.rejectItem(id === 'potion_heal' && this.battle.hp >= this.battle.stats.maxHp);
      return;
    }
    if (auto) this.d.view.autoUsed(id);
    // не больше одного автоприменения за ход: расходники не сгорают цепочкой
    void this.turn(res.events, auto);
  }

  /** Автоприменение: после хода (с короткой паузой, чтобы игрок успел заметить) применяет то, что действительно нужно. */
  private tryAutoUse(): boolean {
    const id = pickAutoUse(this.battle, this.d.autoUse.config);
    if (!id) return false;
    this.busy = true;
    void this.d.clock.delay(320).then(() => {
      this.busy = false;
      if (!this.alive || this.finished || this.battle.over) return;
      this.execute({ type: 'use-item', itemId: id, auto: true });
    });
    return true;
  }

  // ------------------------------------------------------------------ ход

  /** Ход сделан: показать его события и разобрать итог. */
  private async turn(events: GameEvent[], skipAuto = false, deal = false): Promise<void> {
    this.busy = true;
    this.d.tower.count(events);
    await this.d.player.play(events, { deal });
    if (this.alive) this.d.tower.keepConsumables();
    this.busy = false;
    this.afterTurn(skipAuto);
  }

  private afterTurn(skipAuto: boolean): void {
    if (!this.alive) return;
    this.d.view.refresh();
    if (this.battle.over === 'win') {
      void this.finish('win');
      return;
    }
    if (this.battle.over === 'lose') {
      // талант «Возвращение» / «Последний шанс»: герой поднимается сам, без рекламы
      const up = this.battle.autoRevive();
      if (up) {
        this.d.view.selfRevived();
        void this.turn(up);
        return;
      }
      void this.finish('lose');
      return;
    }
    // подсветка врагов, которых можно добить одним ударом
    this.d.view.markKillable();
    if (!skipAuto && this.tryAutoUse()) return;
    this.updateTutorial();
  }

  // ------------------------------------------------------------------ обучение

  /** Первый бой: ударить → подобрать добычу → применить способность → уйти через переход. */
  private updateTutorial(): void {
    const tut = this.d.profile.tutorial;
    if (tut.fight || this.finished) return;
    const battle = this.battle;
    const adj = Grid.neighbors(battle.playerCell).filter((c) => battle.cards[c]);
    if (this.hintStage === 0) {
      const pick =
        adj.find((c) => battle.cards[c]!.kind === 'enemy' && battle.wouldKill(c)) ??
        adj.find((c) => battle.cards[c]!.kind === 'enemy') ??
        adj[0];
      this.d.view.tutorial('attack', pick);
      this.hintStage = 1;
    } else if (this.hintStage === 1) {
      const loot = adj.find((c) => battle.cards[c]!.kind !== 'enemy');
      if (battle.totals.kills > 0 && loot !== undefined) {
        this.d.view.tutorial('loot', loot);
        this.hintStage = 2;
      } else if (battle.totals.turns > 1) {
        this.d.view.tutorial('finish');
        this.hintStage = 3;
      }
    } else if (this.hintStage === 2 && battle.totals.turns > 3) {
      this.d.view.tutorial(battle.stats.abilities.length && !tut.perk ? 'perk' : 'finish');
      this.hintStage = 3;
    }
  }

  // ------------------------------------------------------------------ побег и результат

  private async askEscape(): Promise<void> {
    if (this.finished) return;
    const tower = this.d.tower;
    const leave = await this.d.dialogs.confirmEscape({
      keepsRooms: tower.state.rooms > 0,
      lootAtStake: tower.lootAtStake,
    });
    if (leave) void this.endRun('escape');
  }

  /** Уход из боя — логическая пауза: здесь уместна полноэкранная реклама. */
  private async leave(go: () => void): Promise<void> {
    this.finished = true;
    this.d.tower.leave();
    await this.d.ads.interstitial();
    go();
  }

  private async finish(result: 'win' | 'lose'): Promise<void> {
    // конец хода может прийти дважды (например, два обработчика afterTurn) — награда платится один раз
    if (this.finished) return;
    this.finished = true;
    this.d.platform.gameplayStop();
    this.d.view.clearTutorial();
    if (result === 'lose') {
      this.d.view.outcome('lose');
      await this.d.clock.delay(500);
      if (this.alive) void this.onDeath();
      return;
    }
    const tower = this.d.tower;
    const paid = tower.clearRoom();
    this.d.view.outcome('win');
    await this.d.clock.delay(700);
    if (!this.alive) return;
    if (tower.complete) {
      void this.endRun('complete');
      return;
    }
    // между комнатами: что принесла эта, сколько здоровья осталось — и решение, идти ли выше
    const choice = await this.d.dialogs.roomCleared({
      ...paid,
      hp: this.battle.hp,
      maxHp: this.battle.stats.maxHp,
      rooms: tower.state.rooms,
      nextRoomId: tower.nextRoomId,
    });
    if (choice === 'next') void this.leave(() => this.d.navigator.nextRoom(tower.state));
    else void this.endRun('cashout');
  }

  /** Герой погиб: воскрешение за видео (одно на забег) или конец забега. */
  private async onDeath(): Promise<void> {
    for (;;) {
      const choice = await this.d.dialogs.died({
        canRevive: !this.battle.revived,
        lootLost: this.d.tower.lootAtStake,
        keepsRooms: this.d.tower.state.rooms > 0,
      });
      if (choice === 'end') {
        void this.endRun('dead');
        return;
      }
      if (await this.d.ads.rewarded()) break;
      // видео не досмотрено — окно гибели возвращается
    }
    this.finished = false;
    this.d.platform.gameplayStart();
    void this.turn(this.battle.revive());
  }

  /** Конец забега: итог, рекорд и автопрокачка на заработанные души — и куда идти дальше. */
  private async endRun(reason: RunEndReason): Promise<void> {
    if (this.ended) return;
    this.ended = true;
    this.finished = true;
    this.d.platform.gameplayStop();
    const tower = this.d.tower;
    const lootLost = (reason === 'dead' || reason === 'escape') && tower.lootAtStake;
    const { record, best, autoBuys } = tower.end(reason);
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
        autoBuys,
        canDouble: c.gold + c.souls > 0,
      },
      () => this.doubleReward(),
    );
    if (choice === 'new-run') void this.leave(() => this.d.navigator.newRun());
    else void this.leave(() => this.d.navigator.toHub());
  }

  /** «Удвоить награду» за видео: весь забег ещё раз. */
  private async doubleReward(): Promise<boolean> {
    if (!(await this.d.ads.rewarded())) return false;
    this.d.tower.doubleReward();
    return true;
  }
}
