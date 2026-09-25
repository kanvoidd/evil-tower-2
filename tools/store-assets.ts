/**
 * Генерирует материалы для каталога Яндекс Игр из спрайтов самой игры:
 * store/icon-512.svg и store/cover-800x470.svg (PNG получаем через store/render.py).
 * Запуск: npm run store
 */
import { mkdirSync, writeFileSync } from 'node:fs';

import { type Draw, ENEMY_ART, Grid, HEROES } from '../src/presentation/textures/PixelArt';

const FONT: Record<string, string[]> = {
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
};

const sprite = (draw: Draw, x: number, y: number, s: number, flip = false): string => {
  const g = new Grid();
  draw(g);
  g.outline();
  return g
    .pixels()
    .map(
      ([px, py, c]) =>
        `<rect x="${x + (flip ? 15 - px : px) * s}" y="${y + py * s}" width="${s + 0.6}" height="${s + 0.6}" fill="${c}"/>`,
    )
    .join('');
};

const word = (
  text: string,
  x: number,
  y: number,
  s: number,
  color: string,
  shadow: string,
): string => {
  let out = '';
  let cx = x;
  for (const ch of text) {
    const glyph = FONT[ch];
    if (!glyph) {
      cx += s * 3;
      continue;
    }
    for (const [dx, dy, col] of [
      [s * 0.6, s * 0.8, shadow],
      [0, 0, color],
    ] as const) {
      glyph.forEach((row, r) =>
        [...row].forEach((v, c) => {
          if (v === '1')
            out += `<rect x="${cx + c * s + dx}" y="${y + r * s + dy}" width="${s + 0.5}" height="${s + 0.5}" fill="${col}"/>`;
        }),
      );
    }
    cx += s * 6;
  }
  return out;
};

const tower = (cx: number, top: number, bottom: number, w: number): string => {
  let out = '';
  const floors = 6;
  const h = (bottom - top) / floors;
  for (let i = 0; i < floors; i++) {
    const skew = ((i * 37) % 5) * 5 - 10;
    const fw = w * (0.72 + (i / floors) * 0.36);
    const x = cx - fw / 2 + skew;
    const y = top + i * h;
    out += `<rect x="${x}" y="${y}" width="${fw}" height="${h + 2}" fill="#3a3f52" stroke="#0b0c10" stroke-width="4"/>`;
    out += `<rect x="${x + 4}" y="${y + 4}" width="${fw - 8}" height="6" fill="#5a6078" fill-opacity="0.6"/>`;
    for (let k = 0; k < 3; k++) {
      if ((i + k) % 2 === 0)
        out += `<rect x="${x + fw * (0.2 + k * 0.28)}" y="${y + h * 0.32}" width="${fw * 0.1}" height="${h * 0.34}" fill="#ffc94a" stroke="#0b0c10" stroke-width="2"/>`;
    }
  }
  const tw = w * 0.72;
  for (let k = 0; k < 5; k++)
    out += `<rect x="${cx - tw / 2 + k * (tw / 4.6) + 4}" y="${top - 26}" width="${tw / 9}" height="28" fill="#3a3f52" stroke="#0b0c10" stroke-width="3"/>`;
  return out;
};

const bricks = (w: number, h: number): string => {
  let out = '';
  for (let y = 0; y < h; y += 32) {
    out += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="#ffffff" stroke-opacity="0.05" stroke-width="2"/>`;
    for (let x = (y / 32) % 2 ? 0 : 48; x < w; x += 96)
      out += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 32}" stroke="#ffffff" stroke-opacity="0.05" stroke-width="2"/>`;
  }
  return out;
};

// MuPDF не рисует градиенты, поэтому свечение собирается из концентрических кругов.
const glow = (cx: number, cy: number, r: number, color: string, alpha = 0.09): string =>
  Array.from(
    { length: 14 },
    (_, i) =>
      `<circle cx="${cx}" cy="${cy}" r="${r * (1 - i / 14)}" fill="${color}" fill-opacity="${alpha}"/>`,
  ).join('');

const cover = (): string => {
  const w = 800;
  const h = 470;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="#2a1d3d"/><rect y="250" width="${w}" height="220" fill="#1c1430"/>${bricks(w, h)}
  ${glow(560, 110, 300, '#ff7a2a', 0.1)}
  ${tower(560, 70, 470, 250)}
  ${glow(190, 330, 240, '#ffd86b', 0.07)}
  ${sprite(ENEMY_ART.boss_skeleton_king, 470, 200, 15, true)}
  ${sprite(ENEMY_ART.skeleton_horned, 690, 330, 6, true)}
  ${sprite(HEROES.berserk, 40, 175, 19)}
  ${word('EVIL TOWER 2', 62, 26, 9, '#ffd86b', '#3a1a05')}
</svg>`;
};

const icon = (): string => {
  const s = 512;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" fill="#2a1d3d"/><rect y="300" width="${s}" height="212" fill="#1c1430"/>${bricks(s, s)}
  ${glow(256, 150, 300, '#ff7a2a', 0.1)}
  ${tower(256, 44, 512, 270)}
  ${glow(256, 340, 210, '#ffd86b', 0.07)}
  ${sprite(HEROES.berserk, 76, 122, 22)}
  ${word('2', 398, 22, 13, '#ffd86b', '#3a1a05')}
</svg>`;
};

mkdirSync('store', { recursive: true });
writeFileSync('store/cover-800x470.svg', cover());
writeFileSync('store/icon-512.svg', icon());
console.log('OK: store/icon-512.svg, store/cover-800x470.svg');
