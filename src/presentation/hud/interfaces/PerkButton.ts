import type Phaser from 'phaser';

import type { PerkDef } from '../../../domain/catalog';
import type { PlateButton } from '../../components';

/** Кнопка способности класса в нижней панели. */
export interface PerkButton {
  perk: PerkDef;
  btn: PlateButton;
  costText: Phaser.GameObjects.Text;
  costPlate: Phaser.GameObjects.Arc;
  name: Phaser.GameObjects.Text;
  /** Золотая рамка «заряжено». */
  frame: Phaser.GameObjects.Image;
}
