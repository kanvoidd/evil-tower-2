import type Phaser from 'phaser';

import type { IGameNavigator } from '../../application/game/interfaces/IGameNavigator';
import type { RunCarry } from '../../application/game/interfaces/RunCarry';
import { fadeToScene } from './SceneTransitions';

/** Уход из боя «наездом» камеры: в следующую комнату, в новый забег или в хаб. */
export class GameNavigator implements IGameNavigator {
  constructor(private readonly scene: Phaser.Scene) {}

  nextRoom(carry: RunCarry): void {
    fadeToScene(this.scene, 'Game', { carry });
  }

  newRun(): void {
    fadeToScene(this.scene, 'Game', {});
  }

  toHub(): void {
    fadeToScene(this.scene, 'Hub', { from: 'game' });
  }
}
