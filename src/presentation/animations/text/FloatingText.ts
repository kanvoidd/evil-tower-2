import type Phaser from 'phaser';

import { txt } from '../../components';

/** Всплывающая подпись над полем: урон, «Крит!», добыча, названия способностей. */
export class FloatingText {
  constructor(private readonly scene: Phaser.Scene) {}

  /** Подпись вырастает на месте и уплывает вверх, растворяясь. */
  show(x: number, y: number, text: string, color: string, size: number): void {
    const p = txt(this.scene, x, y, text, size, {
      color,
      weight: 900,
      strokeThickness: Math.max(5, size / 5),
    }).setDepth(100);
    p.setScale(0.6);
    this.scene.tweens.add({ targets: p, scale: 1, duration: 140, ease: 'Back.easeOut' });
    this.scene.tweens.add({
      targets: p,
      y: y - 60,
      alpha: 0,
      delay: 350,
      duration: 650,
      onComplete: () => p.destroy(),
    });
  }
}
