import Phaser from 'phaser';

import { GAME_H, GAME_W } from '../../theme';

/** Каменный фон экрана — под всем остальным и неподвижный относительно камеры. */
export const background = (scene: Phaser.Scene): Phaser.GameObjects.Image =>
  scene.add
    .image(GAME_W / 2, GAME_H / 2, 'bg_stone')
    .setDepth(-100)
    .setScrollFactor(0);

/** Редкие тёплые искры на фоне — живая, но спокойная атмосфера. */
export const addEmbers = (scene: Phaser.Scene, count = 12): void => {
  for (let i = 0; i < count; i++) {
    const s = scene.add
      .image(0, 0, 'glow')
      .setTint(0xffb56b)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(-50)
      .setScrollFactor(0)
      .setAlpha(0);
    const x0 = Phaser.Math.Between(30, GAME_W - 30);
    const y0 = Phaser.Math.Between(700, GAME_H + 40);
    const dist = Phaser.Math.Between(320, 620);
    const peak = Phaser.Math.FloatBetween(0.22, 0.5);
    const size = Phaser.Math.FloatBetween(0.05, 0.11);
    s.setScale(size);
    scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: Phaser.Math.Between(7000, 12000),
      delay: Phaser.Math.Between(0, 6000),
      repeat: -1,
      onUpdate: (tw) => {
        const p = tw.getValue() ?? 0;
        s.setPosition(x0 + Math.sin(p * 5 + i) * 16, y0 - p * dist);
        s.setAlpha(Math.sin(p * Math.PI) * peak);
      },
    });
  }
};
