import type Phaser from 'phaser';

import type { DialogBtn } from './DialogBtn';

export interface DialogOpts {
  title: string;
  body?: string;
  width?: number;
  content?: (scene: Phaser.Scene, c: Phaser.GameObjects.Container, width: number) => number;
  buttons: DialogBtn[];
  closeOnBackdrop?: boolean;
  /** Кнопки столбцом (для окон с тремя и более действиями). */
  vertical?: boolean;
  titleColor?: string;
}
