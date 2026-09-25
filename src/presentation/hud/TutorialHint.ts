import type Phaser from 'phaser';

import type { Point } from '../animations/interfaces/Point';
import { tapHint, txt } from '../components';
import { GAME_W, HEX } from '../theme';

/** Подсказка обучения над полосой ресурса и «палец», указывающий на карточку. */
export class TutorialHint {
  /** Строка над полосой ресурса: подсказки обучения и названия применённых способностей. */
  static readonly Y = 958;

  private text?: Phaser.GameObjects.Text;
  private hand?: Phaser.GameObjects.Container;

  constructor(private readonly scene: Phaser.Scene) {}

  show(text: string, at?: Point): void {
    this.clearHand();
    this.text?.destroy();
    this.text = txt(this.scene, GAME_W / 2, TutorialHint.Y, text, 20, {
      color: HEX.gold,
      wrap: 660,
      align: 'center',
    }).setDepth(50);
    if (at) this.hand = tapHint(this.scene, at.x, at.y + 10);
  }

  /** Игрок сделал то, на что указывал палец. */
  clearHand(): void {
    this.hand?.destroy();
    this.hand = undefined;
  }

  clear(): void {
    this.clearHand();
    this.text?.destroy();
    this.text = undefined;
  }
}
