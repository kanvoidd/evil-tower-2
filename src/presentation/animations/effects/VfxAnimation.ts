import type { ISoundPlayer } from '../../../application/ports';
import type { FxStyle } from '../../../domain/game-data/events';
import { BoardLayout } from '../../board/BoardLayout';
import type { PhaserClock } from '../../phaser/PhaserClock';
import type { Point } from '../interfaces/Point';
import type { FlashAnimation } from './FlashAnimation';
import type { Vfx } from './vfx/Vfx';

/** Эффект способности на клетках поля: у каждого перка свой почерк (рисует `Vfx`), святой свет и огонь ещё и вспыхивают. */
export class VfxAnimation {
  private static readonly FLASH: Partial<Record<FxStyle, number>> = {
    holy: 0xfff3c4,
    fire: 0xff8a2a,
  };

  constructor(
    private readonly vfx: Vfx,
    private readonly flash: FlashAnimation,
    private readonly sound: ISoundPlayer,
    private readonly clock: PhaserClock,
  ) {}

  /** Разрешается, когда можно показывать следующее событие боя. */
  async play(cells: readonly number[], style: FxStyle, origin: Point): Promise<void> {
    if (!cells.length) return;
    this.sound.play('burst');
    const color = VfxAnimation.FLASH[style];
    if (color !== undefined) this.flash.flash(170, color);
    const hold = this.vfx.play(
      style,
      cells.slice(0, 9).map((c) => BoardLayout.cellPos(c)),
      origin,
    );
    await this.clock.delay(hold);
  }
}
