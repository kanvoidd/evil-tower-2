import type Phaser from 'phaser';
import type { IClock } from '../../application/ports';

/** Время сцены: паузы идут по часам Phaser, поэтому замирают вместе с игрой (реклама, свёрнутая вкладка). */
export class PhaserClock implements IClock {
  constructor(private readonly scene: Phaser.Scene) {}

  delay(ms: number): Promise<void> {
    return new Promise((done) => this.scene.time.delayedCall(ms, () => done()));
  }
}
