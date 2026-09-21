import Phaser from 'phaser';
import { CLASS_ORDER, CLASSES } from '../data/classes';
import { ITEMS } from '../data/items';
import { ENEMIES } from '../data/levels';
import { PERKS } from '../data/perks';
import { SVG_ICONS } from './SvgIcons';
import { armorArt, ENEMY_ART, Grid, HEROES, ITEM_ART, weaponArt, type Draw } from './PixelArt';

export const LINEAGE_COLOR: Record<string, string> = {
  warrior: '#e67e22',
  mage: '#5b8def',
  archer: '#3fae55',
  mercenary: '#9b59b6',
};

/**
 * Цвета характеристик. Оттенки разнесены по кругу (красный, янтарный, зелёный, голубой, синий, фиолетовый),
 * чтобы значки урона и здоровья, а также соседние ветки дерева не сливались.
 */
export const STAT_COLOR: Record<string, string> = {
  damage: '#f0483a',
  crit: '#ffb31a',
  health: '#3fdb84',
  dodge: '#22c9e6',
  defense: '#3f8cf4',
  parry: '#a07cf6',
  luck: '#f472b6',
};

/** Цвета путей дерева талантов: урон / жизнь / защита. */
export const PATH_COLOR: Record<string, string> = {
  attack: STAT_COLOR.damage,
  vitality: STAT_COLOR.health,
  guard: STAT_COLOR.defense,
};

/** Цвета значков состояний на карточках врагов. */
export const STATUS_TINT: Record<string, number> = {
  stun: 0xffd86b,
  burn: 0xff7a2a,
  poison: 0x9fd12a,
  mark: 0xb287ff,
  link: 0x7e57d8,
  vuln: 0xff4d6d,
  weak: 0x7fc4ff,
};

export const pathHex = (path: string): number => parseInt((PATH_COLOR[path] ?? '#888888').slice(1), 16);

export const statHex = (stat: string): number => {
  const h = STAT_COLOR[stat];
  return h ? parseInt(h.slice(1), 16) : 0x888888;
};

/**
 * Файлы из src/assets/images подхватываются автоматически: имя файла без расширения = ключ текстуры
 * (например enemy_skeleton.png, hero_warrior.png, item_w_warrior_1.png, perk_berserk_start.png,
 * ico_gold.png). Всё, чего в папке нет, рисуется процедурной заглушкой.
 */
const ART_FILES = import.meta.glob('../assets/images/*.{png,jpg,jpeg,bmp,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export const queueExternalArt = (scene: Phaser.Scene): void => {
  for (const [path, url] of Object.entries(ART_FILES)) {
    const key = path.split('/').pop()!.replace(/\.[^.]+$/, '');
    scene.load.image(key, url);
  }
};

const canvasTex = (
  scene: Phaser.Scene, key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void,
): void => {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h)!;
  draw(tex.getContext());
  tex.refresh();
};

const loadSvg = (scene: Phaser.Scene, key: string, svg: string): Promise<void> =>
  new Promise((resolve) => {
    if (scene.textures.exists(key)) return resolve();
    const img = new Image();
    img.onload = () => {
      if (!scene.textures.exists(key)) scene.textures.addImage(key, img);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });

const bakeSprite = (scene: Phaser.Scene, key: string, draw: Draw, scale = 4): HTMLCanvasElement | null => {
  if (scene.textures.exists(key)) return null;
  const g = new Grid();
  draw(g);
  g.outline();
  const cv = g.toCanvas(scale);
  scene.textures.addCanvas(key, cv);
  scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
  return cv;
};

const rr = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const polyStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, points: number, outer: number, inner: number): void => {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
};

export const CARD_W = 200;
export const CARD_H = 228;

/** Светлый оттенок для иконок на тёмных кнопках и панелях. */
const ICON_LIGHT = '#f4eddc';

export async function bakeTextures(scene: Phaser.Scene): Promise<void> {
  // --- SVG-иконки: svg_* (чёрные, по GDD — для цветных кружков) и svgw_* (светлые — для тёмных панелей)
  await Promise.all(
    Object.entries(SVG_ICONS).flatMap(([name, svg]) => [
      loadSvg(scene, `svg_${name}`, svg),
      loadSvg(scene, `svgw_${name}`, svg.replace(/#000\b/g, ICON_LIGHT)),
    ]),
  );

  // --- герои
  const heroCanvases: Record<string, HTMLCanvasElement> = {};
  for (const id of CLASS_ORDER) {
    const cv = bakeSprite(scene, `hero_${id}`, HEROES[id]);
    if (cv) heroCanvases[id] = cv;
  }

  // --- значки классов: герой на цветном круге
  for (const id of CLASS_ORDER) {
    const col = LINEAGE_COLOR[CLASSES[id].lineage];
    const stage = CLASSES[id].stage;
    canvasTex(scene, `cls_${id}`, 128, 128, (ctx) => {
      const g = ctx.createRadialGradient(64, 56, 8, 64, 64, 62);
      g.addColorStop(0, '#3a3f4d');
      g.addColorStop(1, '#14161c');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(64, 64, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = stage === 2 ? '#f5c518' : col;
      ctx.stroke();
      ctx.imageSmoothingEnabled = false;
      const src = heroCanvases[id] ?? scene.textures.get(`hero_${id}`).getSourceImage();
      ctx.drawImage(src as CanvasImageSource, 12, 10, 104, 104);
      ctx.fillStyle = stage === 2 ? '#f5c518' : col;
      for (let i = 0; i <= stage; i++) {
        ctx.beginPath();
        ctx.arc(64 + (i - stage / 2) * 16, 118, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  // --- враги
  for (const id of Object.keys(ENEMIES)) {
    const draw = ENEMY_ART[id];
    if (draw) bakeSprite(scene, `enemy_${id}`, draw);
  }

  // --- предметы и валюты
  bakeSprite(scene, 'spr_chest', ITEM_ART.chest);
  bakeSprite(scene, 'spr_gold', ITEM_ART.gold);
  bakeSprite(scene, 'item_potion_heal', ITEM_ART.potion_heal);
  bakeSprite(scene, 'item_potion_regen', ITEM_ART.potion_regen);
  bakeSprite(scene, 'item_artifact', ITEM_ART.artifact);
  bakeSprite(scene, 'ico_gold', ITEM_ART.coin);
  bakeSprite(scene, 'ico_soul', ITEM_ART.soul);
  bakeSprite(scene, 'ico_pouch', ITEM_ART.pouch);
  for (const it of ITEMS) {
    const draw = it.slot === 'weapon' ? weaponArt(it.lineage!, it.tier) : armorArt(it.tier);
    bakeSprite(scene, it.icon, draw);
  }

  // --- иконки перков
  for (const p of PERKS) {
    const col = LINEAGE_COLOR[CLASSES[p.classId].lineage];
    const points = { start: 5, p2: 6, p3: 7, legend: 9 }[p.slot];
    canvasTex(scene, p.icon, 128, 128, (ctx) => {
      const legend = p.slot === 'legend';
      const g = ctx.createRadialGradient(64, 56, 6, 64, 64, 60);
      g.addColorStop(0, legend ? '#5a3f9a' : '#343948');
      g.addColorStop(1, '#14161c');
      ctx.fillStyle = g;
      rr(ctx, 6, 6, 116, 116, 34);
      ctx.fill();
      ctx.lineWidth = legend ? 8 : 6;
      ctx.strokeStyle = legend ? '#f5c518' : col;
      ctx.stroke();
      ctx.fillStyle = legend ? '#f5c518' : col;
      polyStar(ctx, 64, 64, points, 36, 18);
      ctx.fill();
      ctx.fillStyle = '#14161c';
      ctx.beginPath();
      ctx.arc(64, 64, 9, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // --- шарики характеристик
  for (const [stat, col] of Object.entries(STAT_COLOR)) {
    canvasTex(scene, `orb_${stat}`, 96, 96, (ctx) => {
      const g = ctx.createRadialGradient(36, 32, 4, 48, 48, 46);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.25, col);
      g.addColorStop(1, '#0a0b0f');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(48, 48, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.stroke();
    });
  }

  // --- квадратные плитки талантов: цвет по пути, золотая рамка у полностью прокачанного
  for (const [path, col] of Object.entries(PATH_COLOR)) {
    canvasTex(scene, `tal_${path}`, 128, 128, (ctx) => {
      const g = ctx.createLinearGradient(0, 8, 0, 120);
      g.addColorStop(0, '#333a4c');
      g.addColorStop(1, '#14161c');
      rr(ctx, 8, 8, 112, 112, 26);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = col;
      ctx.stroke();
      rr(ctx, 16, 16, 96, 96, 20);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.10)';
      ctx.stroke();
    });
  }
  canvasTex(scene, 'tal_max', 128, 128, (ctx) => {
    ctx.shadowColor = '#f5c518';
    ctx.shadowBlur = 16;
    rr(ctx, 8, 8, 112, 112, 26);
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#f5c518';
    ctx.stroke();
  });

  // --- ворота эволюции и кольцо выделения для skill-tree
  canvasTex(scene, 'evo_gate', 128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 60, 4, 64, 64, 60);
    g.addColorStop(0, '#7e57d8');
    g.addColorStop(1, '#1b1230');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(64, 6);
    ctx.lineTo(122, 64);
    ctx.lineTo(64, 122);
    ctx.lineTo(6, 64);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#f5c518';
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.moveTo(64, 26);
    ctx.lineTo(102, 64);
    ctx.lineTo(64, 102);
    ctx.lineTo(26, 64);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = '#f5c518';
    polyStar(ctx, 64, 64, 4, 16, 6);
    ctx.fill();
  });
  canvasTex(scene, 'ring', 128, 128, (ctx) => {
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(64, 64, 58, 0, Math.PI * 2);
    ctx.stroke();
  });

  // --- свечение, пиксель, искра
  canvasTex(scene, 'glow', 128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  });
  canvasTex(scene, 'px', 4, 4, (ctx) => {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 4, 4);
  });
  canvasTex(scene, 'spark', 32, 32, (ctx) => {
    ctx.fillStyle = '#fff';
    polyStar(ctx, 16, 16, 4, 15, 4);
    ctx.fill();
  });

  // --- рамки карт: тело, тёмное «окно» под арт и акцентный контур
  const frame = (key: string, accent: string, tint: string, glow = false): void =>
    canvasTex(scene, key, CARD_W, CARD_H, (ctx) => {
      const body = (): void => rr(ctx, 6, 6, CARD_W - 12, CARD_H - 12, 20);
      if (glow) {
        ctx.shadowColor = accent;
        ctx.shadowBlur = 22;
      }
      const g = ctx.createLinearGradient(0, 6, 0, CARD_H - 6);
      g.addColorStop(0, '#2c334b');
      g.addColorStop(1, '#171b29');
      body();
      ctx.fillStyle = g;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      body();
      ctx.lineWidth = 3;
      ctx.strokeStyle = accent;
      ctx.stroke();
      rr(ctx, 9, 9, CARD_W - 18, CARD_H - 18, 17);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.10)';
      ctx.stroke();
      const wx = 17;
      const wy = 17;
      const ww = CARD_W - 34;
      const wh = 128;
      rr(ctx, wx, wy, ww, wh, 13);
      ctx.fillStyle = '#0d1018';
      ctx.fill();
      const rg = ctx.createRadialGradient(CARD_W / 2, wy + wh * 0.55, 6, CARD_W / 2, wy + wh * 0.55, ww * 0.62);
      rg.addColorStop(0, tint);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.save();
      rr(ctx, wx, wy, ww, wh, 13);
      ctx.clip();
      ctx.fillStyle = rg;
      ctx.fillRect(wx, wy, ww, wh);
      ctx.restore();
      rr(ctx, wx, wy, ww, wh, 13);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.stroke();
    });
  frame('card_enemy', '#b6534d', 'rgba(229,86,77,0.24)');
  frame('card_item', '#4b86c6', 'rgba(90,169,255,0.22)');
  frame('card_gold', '#c9a13f', 'rgba(240,199,94,0.24)');
  frame('card_chest', '#b8823a', 'rgba(240,160,80,0.22)');
  frame('card_hero', '#f0c75e', 'rgba(240,199,94,0.20)', true);
  frame('card_kill', '#5ee39a', 'rgba(94,227,154,0.24)', true);

  // --- фон: глубокий градиент, мягкий свет сверху, едва заметная кладка и виньетка
  canvasTex(scene, 'bg_stone', 720, 1280, (ctx) => {
    const base = ctx.createLinearGradient(0, 0, 0, 1280);
    base.addColorStop(0, '#171b2e');
    base.addColorStop(0.5, '#0f1220');
    base.addColorStop(1, '#090a11');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 720, 1280);
    const light = ctx.createRadialGradient(360, 300, 20, 360, 300, 620);
    light.addColorStop(0, 'rgba(110,120,190,0.26)');
    light.addColorStop(1, 'rgba(110,120,190,0)');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, 720, 1280);
    ctx.strokeStyle = 'rgba(255,255,255,0.022)';
    ctx.lineWidth = 2;
    for (let row = 0; row < 32; row++) {
      const y = row * 40;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(720, y);
      ctx.stroke();
      for (let x = row % 2 ? 0 : 60; x < 720; x += 120) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 40);
        ctx.stroke();
      }
    }
    let seed = 1234;
    const rnd = (): number => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < 1400; i++) {
      ctx.fillStyle = `rgba(255,255,255,${rnd() * 0.025})`;
      ctx.fillRect(rnd() * 720, rnd() * 1280, 2, 2);
    }
    const v = ctx.createRadialGradient(360, 640, 380, 360, 640, 940);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, 720, 1280);
  });
}
