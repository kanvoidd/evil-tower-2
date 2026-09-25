import type Phaser from 'phaser';
import type { Point } from '../interfaces/Point';

/** Полёт значков к цели: монеты и души — к кошелю, подобранный расходник — к своему слоту. */
export class ProjectileAnimation {
  constructor(private readonly scene: Phaser.Scene) {}

  play(key: string, from: Point, to: Point, count: number): void {
    for (let i = 0; i < count; i++) {
      const s = this.scene.add.image(from.x + (Math.random() - 0.5) * 40, from.y + (Math.random() - 0.5) * 40, key)
        .setDisplaySize(34, 34).setDepth(90);
      this.scene.tweens.add({
        targets: s, x: to.x, y: to.y, scale: 0.5, duration: 520 + i * 70, delay: i * 50, ease: 'Cubic.easeIn',
        onComplete: () => s.destroy(),
      });
    }
  }
}
