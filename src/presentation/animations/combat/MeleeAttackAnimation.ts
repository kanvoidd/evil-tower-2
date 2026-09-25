import { BoardLayout } from '../../board/BoardLayout';
import type { CardView } from '../../board/card-view';
import type { PhaserTweens } from '../../phaser/PhaserTweens';
import { TIMING } from '../../theme';
import type { BackgroundMotion } from '../BackgroundMotion';
import type { IAttackAnimation } from '../interfaces/IAttackAnimation';
import type { Point } from '../interfaces/Point';

/** Удар рукой: карточка бросается в клетку цели и возвращается за 0.35 с. */
export class MeleeAttackAnimation implements IAttackAnimation {
  constructor(
    private readonly tweens: PhaserTweens,
    private readonly motion: BackgroundMotion,
  ) {}

  async play(view: CardView, targetCell: number): Promise<void> {
    await this.motion.settled();
    const from = { x: view.c.x, y: view.c.y };
    const to = BoardLayout.cellPos(targetCell);
    const depth = view.c.depth;
    view.c.setDepth(60);
    await this.tweens.play({
      targets: view.c,
      x: to.x,
      y: to.y,
      duration: TIMING.attackLunge / 2,
      ease: 'Quad.easeIn',
    });
    this.motion.follow(
      this.tweens
        .play({
          targets: view.c,
          x: from.x,
          y: from.y,
          duration: TIMING.attackLunge / 2,
          ease: 'Quad.easeOut',
        })
        .then(() => {
          view.c.setDepth(depth);
        }),
    );
  }

  /**
   * Добивающая волна: удары по уже павшему герою показываются коротко, иначе смерть тянется
   * полминуты. Каждая карта возвращается ровно в свою клетку — иначе наложившиеся рывки уносят
   * карточки к герою и оставляют их там.
   */
  rush(view: CardView, toward: Point): void {
    const home = BoardLayout.cellPos(view.cell);
    this.tweens.stop(view.c);
    view.c.setPosition(home.x, home.y);
    void this.tweens
      .play({
        targets: view.c,
        x: (home.x + toward.x) / 2,
        y: (home.y + toward.y) / 2,
        duration: 80,
        yoyo: true,
      })
      .then(() => view.c.setPosition(home.x, home.y));
  }
}
