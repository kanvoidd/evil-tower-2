import type Phaser from 'phaser';

import type { ConsumableId } from '../../../domain/catalog';

/** Слот расходника в панели боя. */
export interface ConsumableSlot {
  id: ConsumableId;
  c: Phaser.GameObjects.Container;
  badge: Phaser.GameObjects.Container;
  count: Phaser.GameObjects.Text;
  /** Золотая рамка «сейчас пригодится». */
  hint: Phaser.GameObjects.Image;
  hintTween?: Phaser.Tweens.Tween;
  /** Расходник чужой линейки (артефакт не у мага). */
  locked: boolean;
}
