import { type ConsumableId, PERK_BY_ID } from '../../domain/catalog';
import type { IBattleSession } from '../../domain/combat';
import { DeathFlow } from './flow/death-flow/DeathFlow';
import { FlowState } from './flow/flow-state/FlowState';
import type { FlowParts } from './flow/interfaces/FlowParts';
import { PlayerMoves } from './flow/player-moves/PlayerMoves';
import { RoomOutcome } from './flow/room-outcome/RoomOutcome';
import { RunEnd } from './flow/run-end/RunEnd';
import { TurnFlow } from './flow/turn-flow/TurnFlow';
import { TutorialGuide } from './flow/tutorial-guide/TutorialGuide';
import type { GameControllerDeps } from './interfaces/GameControllerDeps';
import type { PlayerCommand } from './interfaces/PlayerCommand';

/**
 * Поток боя в комнате — фасад над частями (`flow/`): команды игрока (`PlayerMoves`), ход и
 * автоприменение (`TurnFlow`), обучение (`TutorialGuide`), конец комнаты (`RoomOutcome`),
 * гибель и воскрешение (`DeathFlow`), конец забега (`RunEnd`). Общее у них — состояние потока
 * (`FlowState`) и порты контроллера.
 *
 *   GameScene → GameController → части потока → GameCommandHandler → RoomBattle → Engine
 *                                              → IAnimationPlayer / IGameRenderer / IGameDialogs
 *
 * Правил боя поток не знает (их решает `RoomBattle`), Phaser не знает (он за интерфейсами),
 * а всё, что забег оставляет в профиле, пишет `TowerRun`.
 */
export class GameController {
  /** Бой в комнате — открыт для чтения (отладка, проверки). */
  readonly battle: IBattleSession;
  private readonly state: FlowState;
  private readonly parts: FlowParts;

  constructor(private readonly d: GameControllerDeps) {
    this.battle = d.battle;
    const state = new FlowState(d.battle);
    const parts = {} as { -readonly [K in keyof FlowParts]: FlowParts[K] };
    parts.moves = new PlayerMoves(d, state, parts);
    parts.turns = new TurnFlow(d, state, parts);
    parts.tutorial = new TutorialGuide(d, state, parts);
    parts.room = new RoomOutcome(d, state, parts);
    parts.death = new DeathFlow(d, state, parts);
    parts.runEnd = new RunEnd(d, state, parts);
    this.state = state;
    this.parts = parts;
    d.input.onCommand((cmd) => this.execute(cmd));
  }

  /** Вход в комнату: на поле ложатся первые карты. */
  start(): void {
    this.d.platform.gameplayStart();
    void this.parts.turns.turn(this.battle.start(), false, true);
  }

  /** Сцена закрылась: недоигранное не продолжаем. */
  dispose(): void {
    this.state.alive = false;
    this.d.platform.gameplayStop();
  }

  /**
   * Команда игрока. Ввод (поле, клавиши, кнопки панелей) только сообщает намерение;
   * что из него выйдет, решает бой через обработчик команд.
   */
  execute(cmd: PlayerCommand): void {
    switch (cmd.type) {
      case 'select-cell':
        return this.parts.moves.onCell(cmd.cell);
      case 'use-perk':
        return this.parts.moves.onPerk(PERK_BY_ID[cmd.perkId]);
      case 'use-item':
        return this.parts.moves.onItem(cmd.itemId, !!cmd.auto);
      case 'escape':
        return void this.parts.runEnd.askEscape();
    }
  }

  /** Переключатель «АВТО»: если ситуация уже подходит — сработает сразу, не дожидаясь следующего хода. */
  toggleAuto(item: ConsumableId): boolean {
    const on = this.d.autoUse.toggle(item);
    if (on && this.state.idle) this.parts.turns.tryAutoUse();
    return on;
  }
}
