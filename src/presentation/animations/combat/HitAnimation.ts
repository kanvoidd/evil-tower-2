import type Phaser from 'phaser';
import type { CardView } from '../../board/card-view';
import { TIMING } from '../../theme';

/** Как карточка отвечает на удар: мигает от урона, уходит в сторону от уворота, вздрагивает от неверной цели. */
export class HitAnimation {
  private static readonly TINT = 0xff5a4a;

  constructor(private readonly scene: Phaser.Scene) {}

  /** Мигание урона: 0.75 с, интервал 0.25 с. */
  blink(v: CardView): void {
    v.flash.setVisible(true);
    v.sprite.setTintFill(HitAnimation.TINT);
    const steps = Math.round(TIMING.blinkTotal / TIMING.blinkInterval);
    for (let i = 1; i <= steps; i++) {
      this.scene.time.delayedCall(i * TIMING.blinkInterval, () => {
        const on = i % 2 === 0 && i < steps;
        if (!v.c.scene) return;
        v.flash.setVisible(on);
        if (on) v.sprite.setTintFill(HitAnimation.TINT);
        else v.sprite.clearTint();
      });
    }
  }

  /** Уворот: карточка героя отскакивает в сторону и возвращается. */
  dodge(v: CardView): void {
    this.scene.tweens.add({ targets: v.c, x: v.c.x + 26, duration: 90, yoyo: true });
  }

  /** Неверная цель: карточка коротко вздрагивает. */
  jolt(v: CardView): void {
    this.scene.tweens.add({ targets: v.c, x: v.c.x + 8, duration: 50, yoyo: true, repeat: 2 });
  }
}
