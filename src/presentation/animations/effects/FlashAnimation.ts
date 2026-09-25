import type Phaser from 'phaser';

/** Вспышка и тряска камеры — ощущение силы удара. */
export class FlashAnimation {
  constructor(private readonly scene: Phaser.Scene) {}

  /** Цветная вспышка всего экрана; цвет — 0xRRGGBB. */
  flash(ms: number, color: number): void {
    this.scene.cameras.main.flash(ms, (color >> 16) & 255, (color >> 8) & 255, color & 255);
  }

  shake(ms: number, intensity: number): void {
    this.scene.cameras.main.shake(ms, intensity);
  }
}
