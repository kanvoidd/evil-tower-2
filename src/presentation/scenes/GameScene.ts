import Phaser from 'phaser';

import { AutoUseToggles } from '../../application/game/AutoUseToggles';
import { GameController } from '../../application/game/GameController';
import { TowerRun } from '../../application/game/TowerRun';
import { AudioSettings } from '../../application/settings/AudioSettings';
import type { RunCarry } from '../../domain/expedition';
import { Animations } from '../animations/Animations';
import { GameEventPlayer } from '../animations/GameEventPlayer';
import { BoardView } from '../board/BoardView';
import { CardViewFactory } from '../board/card-view';
import { background, bindAchievementToasts } from '../components';
import { GameDialogs } from '../dialogs/GameDialogs';
import { Hud } from '../hud/Hud';
import { dollyIn, GameNavigator } from '../navigation';
import { PhaserClock } from '../phaser/PhaserClock';
import { PhaserInput } from '../phaser/PhaserInput';
import { PhaserRenderer } from '../phaser/PhaserRenderer';
import type { SceneServices } from './interfaces/SceneServices';

/**
 * Бой в комнате. Сцена только координирует: живёт по циклу Phaser, собирает вид боя
 * (поле, HUD, анимации, окна) и отдаёт поток `GameController`. Правил, команд, анимаций
 * и учёта в профиле здесь нет.
 */
export class GameScene extends Phaser.Scene {
  /** Поток боя текущей комнаты (открыт для отладки и проверок). */
  controller?: GameController;
  private carry?: RunCarry;

  constructor(private readonly services: SceneServices) {
    super('Game');
  }

  /** `carry` — забег продолжается из прошлой комнаты; без него начинается новый забег с 1-1. */
  init(data: { carry?: RunCarry } = {}): void {
    this.carry = data.carry;
    this.controller = undefined;
  }

  create(): void {
    dollyIn(this, 380);
    background(this);
    const { profile, platform, storage, sound, ads } = this.services;
    bindAchievementToasts(this, profile.achievementUnlocked);

    const tower = new TowerRun(profile, platform, storage, this.carry ?? TowerRun.start(profile));
    const battle = tower.enterRoom();
    const autoUse = new AutoUseToggles(profile);
    const animations = new Animations(this, sound);
    const clock = new PhaserClock(this);
    // кнопки панелей отдают команды контроллеру; он появится ниже — до первого нажатия
    const hud = new Hud(
      this,
      battle,
      tower.state,
      {
        command: (cmd) => this.controller?.execute(cmd),
        isAutoOn: (item) => autoUse.isOn(item),
        toggleAuto: (item) => this.controller?.toggleAuto(item) ?? autoUse.isOn(item),
      },
      animations,
      sound,
      new AudioSettings(profile, this.services.audio),
    );
    const board = new BoardView(
      this,
      new CardViewFactory(this),
      battle.stats,
      battle.hp,
      battle.playerCell,
    );
    const player = new GameEventPlayer(battle, board, animations, hud, sound, clock);

    const controller = new GameController({
      battle,
      tower,
      profile,
      autoUse,
      ads,
      platform,
      view: new PhaserRenderer(battle, board, hud, animations, sound),
      player,
      dialogs: new GameDialogs(this),
      navigator: new GameNavigator(this),
      clock,
      input: new PhaserInput(this, () => battle.playerCell),
    });
    this.controller = controller;
    this.events.once('shutdown', () => {
      player.stop();
      controller.dispose();
    });
    controller.start();
  }
}
