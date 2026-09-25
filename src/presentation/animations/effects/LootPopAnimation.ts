import type Phaser from 'phaser';

import { CONSUMABLES } from '../../../domain/catalog';
import type { ConsumableId } from '../../../domain/types';
import { icon, outlineTexture, plateTexture } from '../../components';
import type { Point } from '../interfaces/Point';

/** Расходники из сундука «вылетают» рядком над карточкой и растворяются. */
export class LootPopAnimation {
  constructor(private readonly scene: Phaser.Scene) {}

  play(at: Point, items: readonly ConsumableId[]): void {
    const s = this.scene;
    items.forEach((kind, i) => {
      const x = at.x + (i - (items.length - 1) / 2) * 76;
      const c = s.add
        .container(x, at.y - 40)
        .setDepth(110)
        .setScale(0);
      c.add(s.add.image(0, 0, plateTexture(s, 68, 68, 1, 'panel', 22)));
      c.add(s.add.image(0, 0, outlineTexture(s, 68, 68, 22, '#f0c75e', 3)));
      c.add(icon(s, 0, 0, CONSUMABLES[kind].icon, 48));
      s.tweens.add({ targets: c, scale: 1, duration: 260, delay: i * 120, ease: 'Back.easeOut' });
      s.tweens.add({
        targets: c,
        y: at.y - 110,
        alpha: 0,
        delay: 900 + i * 120,
        duration: 500,
        onComplete: () => c.destroy(),
      });
    });
  }
}
