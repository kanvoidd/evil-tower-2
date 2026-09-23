import type Phaser from 'phaser';
import type { CardKind } from '../../../types';
import type { Pill } from '../../Kit';

/** Карточка на поле: контейнер и детали, которые сцена меняет по ходу боя. */
export interface CardView {
  c: Phaser.GameObjects.Container;
  uid: number;
  kind: CardKind | 'player';
  cell: number;
  frame: Phaser.GameObjects.Image;
  sprite: Phaser.GameObjects.Image;
  flash: Phaser.GameObjects.Image;
  hp?: Pill;
  atk?: Pill;
  shield?: Pill;
  statusRow?: Phaser.GameObjects.Container;
  defId: string;
}
