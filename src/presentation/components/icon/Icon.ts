import type Phaser from 'phaser';

/** Картинка-значок заданной ширины с сохранением пропорций. */
export const icon = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  key: string,
  size: number,
  tint?: number,
): Phaser.GameObjects.Image => {
  const img = scene.add.image(x, y, key);
  img.setDisplaySize(size, size * (img.height / img.width));
  if (tint !== undefined) img.setTint(tint);
  return img;
};
