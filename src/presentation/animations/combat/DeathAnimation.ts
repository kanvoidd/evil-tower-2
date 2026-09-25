import type { CardView } from '../../board/card-view';
import type { PhaserTweens } from '../../phaser/PhaserTweens';

/** Карточка уходит с поля: убитый враг проваливается с поворотом, остальное просто тает. Вид уничтожается. */
export class DeathAnimation {
  constructor(private readonly tweens: PhaserTweens) {}

  kill(v: CardView): Promise<void> {
    return this.tweens.play({ targets: v.c, scale: 0.2, alpha: 0, angle: 12, duration: 200, ease: 'Quad.easeIn' }).then(() => v.c.destroy());
  }

  /** Карта ушла не боем: подобрана, снята способностью или вытеснена новой. */
  vanish(v: CardView, scale: number, ms: number): Promise<void> {
    return this.tweens.play({ targets: v.c, scale, alpha: 0, duration: ms }).then(() => v.c.destroy());
  }
}
