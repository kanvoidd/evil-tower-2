import type Phaser from 'phaser';

/** Показанная подсказка сцены: её объекты, владелец и таймер исчезновения. */
export interface TipState {
  c: Phaser.GameObjects.Container;
  owner: unknown;
  timer: Phaser.Time.TimerEvent;
}
