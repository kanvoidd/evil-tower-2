import type Phaser from 'phaser';

import { FONT_TITLE, FONT_UI, HEX } from '../../theme';
import type { TxtOpts } from './interfaces/TxtOpts';

/** Текст интерфейса: шрифт, обводка и начертание по единым правилам игры. */
export const txt = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  size = 26,
  o: TxtOpts = {},
): Phaser.GameObjects.Text => {
  const title = o.font === 'title';
  const weight = title ? '800' : String(o.weight ?? (o.bold === false ? 700 : 800));
  const stroke = o.strokeThickness ?? (size >= 30 ? 5 : size >= 22 ? 4 : 3);
  const t = scene.add.text(x, y, text, {
    fontFamily: title ? FONT_TITLE : FONT_UI,
    fontSize: `${size}px`,
    fontStyle: weight,
    color: o.color ?? HEX.text,
    stroke: o.stroke ?? HEX.dark,
    strokeThickness: stroke,
    align: o.align ?? 'center',
    wordWrap: o.wrap ? { width: o.wrap, useAdvancedWrap: true } : undefined,
    lineSpacing: o.lineSpacing ?? 2,
  });
  const org = o.origin ?? [0.5, 0.5];
  t.setOrigin(org[0], org[1]);
  t.setResolution(2);
  if (o.maxWidth) fitText(t, o.maxWidth);
  return t;
};

/** Уменьшает шрифт, пока текст не поместится по ширине. */
export const fitText = (t: Phaser.GameObjects.Text, maxWidth: number, minSize = 12): void => {
  let size = parseInt(String(t.style.fontSize), 10);
  let guard = 0;
  while (t.width > maxWidth && size > minSize && guard++ < 40) {
    size -= 1;
    t.setFontSize(size);
  }
};

/** То же по высоте: для многострочного текста с переносом. */
export const fitHeight = (t: Phaser.GameObjects.Text, maxHeight: number, minSize = 12): void => {
  let size = parseInt(String(t.style.fontSize), 10);
  let guard = 0;
  while (t.height > maxHeight && size > minSize && guard++ < 40) {
    size -= 1;
    t.setFontSize(size);
  }
};
