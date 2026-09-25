import type Phaser from 'phaser';
import { statHex } from '../../textures/Textures';
import { icon } from '../icon/Icon';
import { plateTexture } from '../plate/Plates';
import { fitText, txt } from '../text/Text';
import type { Pill } from './interfaces/Pill';

/** Единый источник цветов — STAT_COLOR: здоровье зелёное, урон красный, крит янтарный и т. д. */
export const statColor = (stat: string): number => statHex(stat);

/** Цветной кружок с чёрной SVG-иконкой и числом справа. */
export const statChip = (
  scene: Phaser.Scene, x: number, y: number, stat: string, value: string, size = 40, fontSize = 28,
  align: 'left' | 'center' = 'left',
): Phaser.GameObjects.Container => {
  const c = scene.add.container(x, y);
  const disc = scene.add.circle(0, 0, size / 2, statColor(stat)).setStrokeStyle(2.5, 0x0b0d12);
  const ico = icon(scene, 0, 0, `svg_${stat}`, size * 0.6);
  const label = txt(scene, size / 2 + 8, -1, value, fontSize, { origin: [0, 0.5], weight: 900 });
  c.add([disc, ico, label]);
  if (align === 'center') {
    const total = size + 8 + label.width;
    const shift = -total / 2 + size / 2;
    c.each((ch: Phaser.GameObjects.GameObject) => ((ch as any).x += shift));
  }
  return c;
};

/** Плашка «иконка + число» фиксированной ширины: текст подгоняется, соседние плашки не пересекаются. */
export const statPill = (
  scene: Phaser.Scene, x: number, y: number,
  o: { w: number; h?: number; stat: string; text: string; fontSize?: number; iconKey?: string; color?: number },
): Pill => {
  const h = o.h ?? 32;
  const c = scene.add.container(x, y);
  c.add(scene.add.image(0, 0, plateTexture(scene, o.w, h, 1, 'dark', h / 2)));
  const dx = -o.w / 2 + h / 2;
  c.add(scene.add.circle(dx, 0, h / 2 - 3, o.color ?? statColor(o.stat)));
  c.add(icon(scene, dx, 0, o.iconKey ?? `svg_${o.stat}`, (h - 6) * 0.62));
  const areaW = o.w - h - 6;
  const label = txt(scene, dx + h / 2 + 3 + areaW / 2, -1, o.text, o.fontSize ?? 19, { weight: 900, strokeThickness: 3 });
  c.add(label);
  const fit = (): void => {
    label.setFontSize(o.fontSize ?? 19);
    fitText(label, areaW - 4, 10);
  };
  fit();
  return {
    c,
    setText: (s) => {
      label.setText(s);
      fit();
    },
    setTextColor: (hex) => label.setColor(hex),
  };
};

/** Цветной кружок характеристики с чёрной иконкой (тот же язык, что у плашек ATK/HP и дерева навыков). */
export const statDisc = (
  scene: Phaser.Scene, x: number, y: number, stat: string, size = 34, o: { color?: number; iconKey?: string } = {},
): Phaser.GameObjects.Container => {
  const c = scene.add.container(x, y);
  c.add(scene.add.circle(0, 0, size / 2, o.color ?? statColor(stat)).setStrokeStyle(2, 0x0b0d12));
  c.add(icon(scene, 0, 0, o.iconKey ?? `svg_${stat}`, size * 0.6));
  return c;
};
