import type Phaser from 'phaser';
import type { PanelSpec } from './interfaces/PanelSpec';
import type { PlateStyle } from './interfaces/PlateStyle';

/**
 * Плиты интерфейса — процедурные текстуры панелей, рамок и теней. Текстура рисуется один раз
 * на размер и стиль и дальше берётся из кэша текстур Phaser по ключу.
 */
const PANEL_SPEC: Record<Exclude<PlateStyle, 'stone'>, PanelSpec> = {
  panel: { top: '#242a3f', bottom: '#181b29', border: '#090a10', hi: 'rgba(255,255,255,0.08)' },
  raised: { top: '#40476a', bottom: '#2a2f49', border: '#0f1119', hi: 'rgba(255,255,255,0.18)' },
  gold: { top: '#f7de94', bottom: '#d09a37', border: '#5f400f', hi: 'rgba(255,255,255,0.55)' },
  red: { top: '#f2726c', bottom: '#b73d36', border: '#48130f', hi: 'rgba(255,255,255,0.30)' },
  green: { top: '#66e09a', bottom: '#329f60', border: '#0f3b23', hi: 'rgba(255,255,255,0.32)' },
  dark: { top: '#151825', bottom: '#0e1019', border: '#06070b', hi: 'rgba(255,255,255,0.04)' },
  glass: { top: 'rgba(255,255,255,0.08)', bottom: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.12)', hi: 'rgba(255,255,255,0.06)' },
};

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void => {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
};

/** Чистая панель/кнопка: градиент, контур и светлая кромка. Параметр seed оставлен для совместимости. */
export const plateTexture = (
  scene: Phaser.Scene, w: number, h: number, _seed = 1, style: PlateStyle = 'panel', radius = 20,
): string => {
  const st = style === 'stone' ? 'raised' : style;
  const rw = Math.round(w);
  const rh = Math.round(h);
  const key = `pl_${rw}x${rh}_${st}_${radius}`;
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, rw, rh)!;
  const ctx = tex.getContext();
  const s = PANEL_SPEC[st];
  roundRect(ctx, 1, 1, rw - 2, rh - 2, radius);
  const g = ctx.createLinearGradient(0, 0, 0, rh);
  g.addColorStop(0, s.top);
  g.addColorStop(1, s.bottom);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = s.border;
  ctx.stroke();
  roundRect(ctx, 3.5, 3.5, rw - 7, rh - 7, Math.max(2, radius - 2.5));
  const hg = ctx.createLinearGradient(0, 0, 0, rh * 0.55);
  hg.addColorStop(0, s.hi);
  hg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = hg;
  ctx.stroke();
  tex.refresh();
  return key;
};

/** Прозрачный скруглённый контур — рамка выделения. */
export const outlineTexture = (scene: Phaser.Scene, w: number, h: number, radius: number, color: string, lw = 3): string => {
  const rw = Math.round(w);
  const rh = Math.round(h);
  const key = `ol_${rw}x${rh}_${radius}_${color}_${lw}`;
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, rw, rh)!;
  const ctx = tex.getContext();
  roundRect(ctx, lw / 2, lw / 2, rw - lw, rh - lw, radius);
  ctx.lineWidth = lw;
  ctx.strokeStyle = color;
  ctx.stroke();
  tex.refresh();
  return key;
};

/** Мягкая тень под панелью (рисуется отдельной картинкой). */
export const shadowTexture = (scene: Phaser.Scene, w: number, h: number, radius = 20, blur = 16): string => {
  const rw = Math.round(w);
  const rh = Math.round(h);
  const key = `sh_${rw}x${rh}_${radius}_${blur}`;
  if (scene.textures.exists(key)) return key;
  const pad = blur * 2;
  const cw = rw + pad * 2;
  const ch = rh + pad * 2;
  const tex = scene.textures.createCanvas(key, cw, ch)!;
  const ctx = tex.getContext();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = cw + 40;
  roundRect(ctx, pad - (cw + 40), pad, rw, rh, radius);
  ctx.fillStyle = '#000';
  ctx.fill();
  tex.refresh();
  return key;
};

/** Панель с тенью — для карточек и блоков. */
export const panel = (
  scene: Phaser.Scene, x: number, y: number, w: number, h: number, style: PlateStyle = 'panel', radius = 24,
): Phaser.GameObjects.Container => {
  const c = scene.add.container(x, y);
  c.add(scene.add.image(0, 8, shadowTexture(scene, w, h, radius)).setAlpha(0.85));
  c.add(scene.add.image(0, 0, plateTexture(scene, w, h, 1, style, radius)));
  return c;
};
