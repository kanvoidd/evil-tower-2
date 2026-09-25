import type { CardView } from '../../board/card-view';
import { BoardLayout } from '../../board/BoardLayout';
import type { PhaserTweens } from '../../phaser/PhaserTweens';
import { TIMING } from '../../theme';

/** Перемещение карточек по полю: шаг героя, сдвиг карты, обмен двух клеток местами. */
export class MoveAnimation {
  constructor(private readonly tweens: PhaserTweens) {}

  /** Шаг или сдвиг на клетку. */
  step(v: CardView, toCell: number): Promise<void> {
    const to = BoardLayout.cellPos(toCell);
    return this.tweens.play({ targets: v.c, x: to.x, y: to.y, duration: TIMING.cardMove, ease: 'Quad.easeOut' });
  }

  /** Две клетки меняются содержимым (любая из карточек может отсутствовать). */
  swap(a: CardView | undefined, b: CardView | undefined, cellA: number, cellB: number): Promise<void> {
    const pa = BoardLayout.cellPos(cellA);
    const pb = BoardLayout.cellPos(cellB);
    return Promise.all([
      a ? this.tweens.play({ targets: a.c, x: pb.x, y: pb.y, duration: TIMING.cardMove, ease: 'Quad.easeInOut' }) : Promise.resolve(),
      b ? this.tweens.play({ targets: b.c, x: pa.x, y: pa.y, duration: TIMING.cardMove, ease: 'Quad.easeInOut' }) : Promise.resolve(),
    ]).then(() => undefined);
  }
}
