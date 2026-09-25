import type Phaser from 'phaser';
import { PlateButton } from '../plate-button/PlateButton';
import type { IMuteSwitch } from './interfaces/IMuteSwitch';

/** Кнопка «звук вкл/выкл». */
export const soundButton = (scene: Phaser.Scene, x: number, y: number, audio: IMuteSwitch, size = 64): PlateButton => {
  const btn = new PlateButton(scene, x, y, {
    w: size, h: size, icon: audio.muted ? 'svg_sound_off' : 'svg_sound', iconSize: size * 0.56, radius: 18,
    onClick: () => {
      const muted = audio.toggleMuted();
      btn.setIcon(muted ? 'svg_sound_off' : 'svg_sound');
    },
  });
  return btn;
};
