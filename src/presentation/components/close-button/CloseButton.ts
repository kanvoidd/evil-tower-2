import type Phaser from 'phaser';
import { GAME_W } from '../../theme';
import { PlateButton } from '../plate-button/PlateButton';

/** Крестик закрытия экрана в правом верхнем углу. */
export const closeButton = (scene: Phaser.Scene, onClick: () => void, x = GAME_W - 66, y = 62): PlateButton =>
  new PlateButton(scene, x, y, { w: 68, h: 68, icon: 'svg_close', iconSize: 30, radius: 20, onClick });
