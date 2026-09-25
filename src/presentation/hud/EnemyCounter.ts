import Phaser from 'phaser';

import { t } from '../../i18n';
import { txt } from '../components';
import { GAME_W, HEX } from '../theme';

/** Сколько врагов ещё уложить до перехода, а когда норма выполнена — «Выход открыт». */
export class EnemyCounter {
  private static readonly BAR_W = 260;
  private static readonly BAR_Y = 214;

  private readonly text: Phaser.GameObjects.Text;
  private readonly bar: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.text = txt(scene, GAME_W / 2, 202, '', 20, {
      color: HEX.textDim,
      weight: 800,
      strokeThickness: 0,
    });
    this.bar = scene.add.graphics();
  }

  update(left: number, total: number, exitOpen: boolean): void {
    const { BAR_W, BAR_Y } = EnemyCounter;
    this.text.setText(exitOpen ? t('game.exit_open') : t('game.enemies', { n: left }));
    this.text.setColor(exitOpen ? HEX.gold : HEX.textDim);
    this.bar.clear();
    this.bar
      .fillStyle(0x000000, 0.45)
      .fillRoundedRect(GAME_W / 2 - BAR_W / 2, BAR_Y, BAR_W, 7, 3.5);
    const done = total > 0 ? Phaser.Math.Clamp(1 - left / total, 0, 1) : 0;
    if (done > 0) {
      this.bar
        .fillStyle(exitOpen ? 0xf0c75e : 0xe5564d, 1)
        .fillRoundedRect(GAME_W / 2 - BAR_W / 2, BAR_Y, Math.max(7, BAR_W * done), 7, 3.5);
    }
  }
}
