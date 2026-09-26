import type Phaser from 'phaser';

import type { NodeState } from '../../../domain/progression';

/**
 * Связь двух узлов дерева. Пройденная — цвета пути (у талантов) или золотая, ведущая к доступному
 * узлу — светлая, остальные — тёмные.
 */
export class EdgeView {
  private readonly img: Phaser.GameObjects.Image;

  constructor(
    scene: Phaser.Scene,
    readonly a: string,
    readonly b: string,
    from: { x: number; y: number },
    to: { x: number; y: number },
    private readonly color: number,
  ) {
    const len = Math.hypot(to.x - from.x, to.y - from.y);
    this.img = scene.add.image(from.x, from.y, 'px').setOrigin(0, 0.5).setDepth(1);
    this.img.setRotation(Math.atan2(to.y - from.y, to.x - from.x));
    this.img.setDisplaySize(len, 7);
  }

  /** Связь на текущей вкладке дерева видна, на другой — спрятана. */
  setVisible(on: boolean): void {
    this.img.setVisible(on);
  }

  paint(sa: NodeState, sb: NodeState): void {
    const done = (s: NodeState): boolean => s === 'owned';
    if (done(sa) && done(sb)) this.img.setTint(this.color).setAlpha(0.95);
    else if (done(sa) && (sb === 'available' || sb === 'partial'))
      this.img.setTint(0x9aa2c4).setAlpha(0.8);
    else this.img.setTint(0x2b3148).setAlpha(0.85);
  }
}
