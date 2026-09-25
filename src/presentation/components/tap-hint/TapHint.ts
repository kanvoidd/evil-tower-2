import type Phaser from 'phaser';
import { COLOR } from '../../theme';

/** Мягкий указатель для обучения. */
export const tapHint = (scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container => {
  const c = scene.add.container(x, y).setDepth(1500);
  const ring = scene.add.circle(0, 0, 30, 0xffffff, 0).setStrokeStyle(4, COLOR.glow);
  const finger = scene.add.triangle(0, 44, 0, 0, 34, 0, 17, -30, COLOR.glow).setStrokeStyle(3, 0x0b0d12).setOrigin(0.5, 0);
  c.add([ring, finger]);
  scene.tweens.add({ targets: ring, scale: { from: 0.6, to: 1.6 }, alpha: { from: 1, to: 0 }, duration: 1100, repeat: -1 });
  scene.tweens.add({ targets: finger, y: 58, duration: 850, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  return c;
};
