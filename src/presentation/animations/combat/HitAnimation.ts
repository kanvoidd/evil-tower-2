import type Phaser from 'phaser';

import { BoardLayout } from '../../board/BoardLayout';
import type { CardView } from '../../board/card-view';
import { TIMING } from '../../theme';

/** Как карточка отвечает на удар: мигает от урона, уходит в сторону от уворота, вздрагивает от неверной цели. */
export class HitAnimation {
  private static readonly TINT = 0xff5a4a;

  /** Идущее вздрагивание или уворот карточки — новое обрывает прежнее. */
  private readonly shakes = new WeakMap<Phaser.GameObjects.Container, Phaser.Tweens.Tween>();

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
    this.shake(v, 26, 90, 0);
  }

  /** Неверная цель: карточка коротко вздрагивает. */
  jolt(v: CardView): void {
    this.shake(v, 8, 50, 2);
  }

  /**
   * Отскок от места карточки на её клетке и обратно. Считается от клетки, а не от текущего x:
   * иначе частые нажатия запускали новый отскок со смещённой точки, и карточка «уезжала».
   */
  private shake(v: CardView, dx: number, duration: number, repeat: number): void {
    const home = BoardLayout.cellPos(v.cell).x;
    this.shakes.get(v.c)?.stop();
    v.c.x = home;
    const tween = this.scene.tweens.add({
      targets: v.c,
      x: home + dx,
      duration,
      yoyo: true,
      repeat,
      onComplete: () => {
        if (v.c.scene) v.c.x = home;
        this.shakes.delete(v.c);
      },
      onStop: () => {
        if (v.c.scene) v.c.x = home;
      },
    });
    this.shakes.set(v.c, tween);
  }
}
