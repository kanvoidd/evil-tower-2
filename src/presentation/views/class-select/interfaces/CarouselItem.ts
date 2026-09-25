import type Phaser from 'phaser';
import type { ClassId } from '../../../../domain/types';

/** Герой в карусели: герб, свечение и замок у закрытого. */
export interface CarouselItem {
  classId: ClassId;
  opened: boolean;
  container: Phaser.GameObjects.Container;
  glow: Phaser.GameObjects.Image;
  pic: Phaser.GameObjects.Image;
  lock: Phaser.GameObjects.Container;
}
