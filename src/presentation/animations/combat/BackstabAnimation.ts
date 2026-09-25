import Phaser from 'phaser';

import type { ISoundPlayer } from '../../../application/ports';
import { BoardLayout } from '../../board/BoardLayout';
import type { CardView } from '../../board/card-view';
import type { PhaserClock } from '../../phaser/PhaserClock';
import type { PhaserTweens } from '../../phaser/PhaserTweens';
import { CARD_W } from '../../textures/Textures';
import { GAME_W } from '../../theme';
import type { BackgroundMotion } from '../BackgroundMotion';
import type { BurstAnimation } from '../effects/BurstAnimation';
import type { Vfx } from '../effects/vfx/Vfx';
import type { IAttackAnimation } from '../interfaces/IAttackAnimation';

/**
 * Удар в спину (наёмник): герой исчезает в дыму, возникает за спиной цели, бьёт двумя скрещёнными
 * росчерками и возвращается на своё место. Как и бросок рукой, разрешается в момент касания —
 * возврат идёт в фоне.
 */
export class BackstabAnimation implements IAttackAnimation {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly tweens: PhaserTweens,
    private readonly vfx: Vfx,
    private readonly burst: BurstAnimation,
    private readonly sound: ISoundPlayer,
    private readonly clock: PhaserClock,
    private readonly motion: BackgroundMotion,
  ) {}

  async play(attacker: CardView, targetCell: number): Promise<void> {
    await this.motion.settled();
    const v = attacker.c;
    const a = { x: v.x, y: v.y };
    const b = BoardLayout.cellPos(targetCell);
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const dx = (b.x - a.x) / len;
    const dy = (b.y - a.y) / len;
    // «за спиной» — с дальней от героя стороны цели; карточка героя не выходит за края экрана
    const behind = {
      x: Phaser.Math.Clamp(b.x + dx * 96, CARD_W / 2 + 4, GAME_W - CARD_W / 2 - 4),
      y: Phaser.Math.Clamp(b.y + dy * 96, 280, 880),
    };
    const depth = v.depth;
    v.setDepth(60);
    this.sound.play('dodge');
    this.vfx.smoke(a);
    await this.tweens.play({
      targets: v,
      alpha: 0,
      scale: 0.7,
      duration: 110,
      ease: 'Quad.easeIn',
    });
    v.setPosition(behind.x, behind.y);
    this.vfx.smoke(behind);
    // за спиной герой чуть меньше — цель остаётся видна
    await this.tweens.play({
      targets: v,
      alpha: 1,
      scale: 0.8,
      duration: 120,
      ease: 'Back.easeOut',
    });
    // два скрещённых росчерка на цели
    const ang = Phaser.Math.RadToDeg(Math.atan2(dy, dx)) + 90;
    this.slash(b.x, b.y, ang - 32, 0);
    this.slash(b.x, b.y, ang + 32, 70);
    this.burst.play(b.x, b.y, 0xffe38a, 14);
    await this.clock.delay(90);
    this.motion.follow(
      (async () => {
        await this.clock.delay(190);
        if (!v.scene) return;
        this.vfx.smoke({ x: v.x, y: v.y });
        await this.tweens.play({
          targets: v,
          alpha: 0,
          scale: 0.7,
          duration: 100,
          ease: 'Quad.easeIn',
        });
        v.setPosition(a.x, a.y);
        this.vfx.smoke(a);
        await this.tweens.play({
          targets: v,
          alpha: 1,
          scale: 1,
          duration: 120,
          ease: 'Back.easeOut',
        });
        v.setDepth(depth);
      })(),
    );
  }

  /** Быстрый белый росчерк клинка. */
  private slash(x: number, y: number, angle: number, delay: number): void {
    const s = this.scene.add
      .image(x, y, 'px')
      .setDepth(75)
      .setAngle(angle)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(20, 8)
      .setAlpha(0);
    this.scene.tweens.add({
      targets: s,
      alpha: { from: 1, to: 0 },
      displayWidth: 210,
      displayHeight: 5,
      delay,
      duration: 240,
      ease: 'Cubic.easeOut',
      onComplete: () => s.destroy(),
    });
  }
}
