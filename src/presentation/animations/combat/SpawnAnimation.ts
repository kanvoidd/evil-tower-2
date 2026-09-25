import type { CardView } from '../../board/card-view';
import type { PhaserTweens } from '../../phaser/PhaserTweens';
import { TIMING } from '../../theme';

/** Карточка выпадает на клетку: вырастает из точки с лёгким перелётом масштаба. */
export class SpawnAnimation {
  constructor(private readonly tweens: PhaserTweens) {}

  play(v: CardView): Promise<void> {
    v.c.setScale(0);
    return this.tweens.play({ targets: v.c, scale: 1, duration: TIMING.cardSpawn, ease: 'Back.easeOut' });
  }
}
