import type Phaser from 'phaser';

import type { CardKind } from '../../../../domain/catalog';
import type { CellIndex } from '../../../../domain/shared';
import type { Pill } from '../../../components';

/** Карточка на поле: контейнер и детали, которые сцена меняет по ходу боя. */
export interface CardView {
  c: Phaser.GameObjects.Container;
  uid: number;
  kind: CardKind | 'player';
  cell: CellIndex;
  frame: Phaser.GameObjects.Image;
  sprite: Phaser.GameObjects.Image;
  flash: Phaser.GameObjects.Image;
  hp?: Pill;
  atk?: Pill;
  shield?: Pill;
  statusRow?: Phaser.GameObjects.Container;
  defId: string;
}
