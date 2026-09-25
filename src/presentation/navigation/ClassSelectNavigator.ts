import type Phaser from 'phaser';
import type { IClassSelectNavigator } from '../../application/class-select/interfaces/IClassSelectNavigator';
import { fadeToScene } from './SceneTransitions';

/** Из выбора героя — в первый забег или обратно на экран, откуда пришли (`from` — ключ сцены). */
export class ClassSelectNavigator implements IClassSelectNavigator {
  constructor(private readonly scene: Phaser.Scene, private readonly from: string) {}

  startGame(): void {
    fadeToScene(this.scene, 'Game', {});
  }

  back(): void {
    fadeToScene(this.scene, this.from);
  }
}
