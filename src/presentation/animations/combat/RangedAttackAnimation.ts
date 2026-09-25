import type Phaser from 'phaser';

import type { ISoundPlayer } from '../../../application/ports';
import { BoardLayout } from '../../board/BoardLayout';
import type { CardView } from '../../board/card-view';
import type { PhaserClock } from '../../phaser/PhaserClock';
import type { BackgroundMotion } from '../BackgroundMotion';
import type { Vfx } from '../effects/vfx/Vfx';
import type { IAttackAnimation } from '../interfaces/IAttackAnimation';

/** Дальний удар: лучник пускает стрелу (`shot`), маг — молнию (`bolt`). Летящей «звёздочки» в игре нет. */
export class RangedAttackAnimation implements IAttackAnimation {
  constructor(
    private readonly style: 'shot' | 'bolt',
    private readonly scene: Phaser.Scene,
    private readonly vfx: Vfx,
    private readonly sound: ISoundPlayer,
    private readonly clock: PhaserClock,
    private readonly motion: BackgroundMotion,
  ) {}

  async play(attacker: CardView, targetCell: number): Promise<void> {
    await this.motion.settled();
    const a = attacker.c;
    this.scene.tweens.add({ targets: a, scale: 1.05, duration: 90, yoyo: true });
    this.sound.play('burst');
    const hold = this.vfx.play(this.style, [BoardLayout.cellPos(targetCell)], { x: a.x, y: a.y });
    await this.clock.delay(hold);
  }
}
