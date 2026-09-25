import Phaser from 'phaser';

import { CLASS_ORDER, CLASSES } from '../../domain/catalog/classes';
import { ENEMIES } from '../../domain/catalog/enemies';
import { ITEMS } from '../../domain/catalog/items';
import { PERKS, type VfxStyle } from '../../domain/catalog/perks';
import { armorArt, type Draw, ENEMY_ART, Grid, HEROES, ITEM_ART, weaponArt } from './PixelArt';
import { SVG_ICONS } from './SvgIcons';

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
  corpse: 0x8fd14f,
  haunt: 0xa9e8ff,
  ghost: 0xa9e8ff,
};

export const pathHex = (path: string): number =>
  parseInt((PATH_COLOR[path] ?? '#888888').slice(1), 16);

export const statHex = (stat: string): number => {
  const h = STAT_COLOR[stat];
  return h ? parseInt(h.slice(1), 16) : 0x888888;
};

/**
 * Файлы из src/assets/images подхватываются автоматически: имя файла без расширения = ключ текстуры
 * (например enemy_skeleton.png, hero_warrior.png, item_w_warrior_1.png, perk_berserk_start.png,
 * ico_gold.png). Всё, чего в папке нет, рисуется процедурной заглушкой.
 */
const ART_FILES = import.meta.glob('../../assets/images/*.{png,jpg,jpeg,bmp,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export const queueExternalArt = (scene: Phaser.Scene): void => {
  for (const [path, url] of Object.entries(ART_FILES)) {
    const key = path
      .split('/')
      .pop()!
      .replace(/\.[^.]+$/, '');
    scene.load.image(key, url);
  }
};

const canvasTex = (
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
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

const bakeSprite = (
  scene: Phaser.Scene,
  key: string,
  draw: Draw,
  scale = 4,
): HTMLCanvasElement | null => {
  if (scene.textures.exists(key)) return null;
  const g = new Grid();
  draw(g);
  g.outline();
  const cv = g.toCanvas(scale);
  scene.textures.addCanvas(key, cv);
  scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
  return cv;
};

const rr = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const polyStar = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  points: number,
  outer: number,
  inner: number,
): void => {
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

/** Цвета семейств эффектов — те же, что у вспышек способностей в бою. */
export const VFX_COLOR: Record<VfxStyle, string> = {
  bolt: '#9ad8ff',
  chain: '#7fc4ff',
  arcane: '#b287ff',
  beam: '#fff0b0',
  fire: '#ff8a2a',
  explosion: '#ffb44a',
  holy: '#fff3c4',
  banner: '#f0c75e',
  ignite: '#ff6a1a',
  fireball: '#ffa03a',
  detonate: '#ff5a2a',
  inferno: '#ff7a18',
  dark: '#a678ff',
  soul: '#a98bff',
  mark: '#ff6a8a',
  quake: '#d2a15a',
  corpse: '#8fd14f',
  ghost: '#a9e8ff',
  voodoo: '#d05aff',
  harvest: '#9a6bff',
  slam: '#ffe0a0',
  blades: '#eaf2ff',
  shot: '#d8f0a0',
  arrows: '#c6e878',
  smoke: '#9aa0b4',
  swap: '#7fe8d0',
  rewind: '#b79dff',
};

type Ctx = CanvasRenderingContext2D;

/** Ломаная: удобно рисовать молнии, стрелы и клинки. */
const path = (ctx: Ctx, pts: number[][], close = false): void => {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  if (close) ctx.closePath();
};

const stroke = (ctx: Ctx, w: number): void => {
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
};

/** Дуга со стрелкой на конце — для «обмена местами» и «отката времени». */
const arcArrow = (
  ctx: Ctx,
  cx: number,
  cy: number,
  r: number,
  a0: number,
  a1: number,
  w: number,
): void => {
  ctx.beginPath();
  ctx.arc(cx, cy, r, a0, a1);
  stroke(ctx, w);
  const tip = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
  const n = [-Math.sin(a1), Math.cos(a1)];
  const t = [Math.cos(a1), Math.sin(a1)];
  path(
    ctx,
    [
      [tip[0] + t[0] * 11, tip[1] + t[1] * 11],
      [tip[0] - t[0] * 4 + n[0] * 9, tip[1] - t[1] * 4 + n[1] * 9],
      [tip[0] - t[0] * 4 - n[0] * 9, tip[1] - t[1] * 4 - n[1] * 9],
    ],
    true,
  );
  ctx.fill();
};

/**
 * Значок семейства эффектов: у каждой способности свой узнаваемый рисунок, чтобы десять
 * кнопок в нижней панели не сливались в один ряд одинаковых звёздочек.
 */
const VFX_GLYPH: Record<VfxStyle, (ctx: Ctx) => void> = {
  // молния — ломаная стрела вниз
  bolt: (ctx) => {
    path(
      ctx,
      [
        [74, 22],
        [44, 62],
        [64, 64],
        [50, 106],
        [84, 60],
        [62, 58],
      ],
      true,
    );
    ctx.fill();
  },
  // цепная молния — два разряда друг за другом
  chain: (ctx) => {
    path(ctx, [
      [46, 24],
      [30, 62],
      [44, 62],
      [32, 96],
    ]);
    stroke(ctx, 9);
    path(ctx, [
      [90, 32],
      [74, 66],
      [88, 66],
      [76, 100],
    ]);
    stroke(ctx, 9);
  },
  // тайная магия — звезда в кольце
  arcane: (ctx) => {
    ctx.beginPath();
    ctx.arc(64, 64, 42, 0, Math.PI * 2);
    stroke(ctx, 7);
    polyStar(ctx, 64, 64, 4, 30, 9);
    ctx.fill();
  },
  // луч — столб света с гранями
  beam: (ctx) => {
    path(
      ctx,
      [
        [50, 18],
        [78, 18],
        [86, 110],
        [42, 110],
      ],
      true,
    );
    ctx.fill();
    ctx.globalAlpha = 0.45;
    ctx.fillRect(58, 18, 12, 92);
    ctx.globalAlpha = 1;
  },
  // огонь — язык пламени
  fire: (ctx) => {
    ctx.beginPath();
    ctx.moveTo(64, 14);
    ctx.bezierCurveTo(98, 52, 100, 78, 84, 96);
    ctx.bezierCurveTo(70, 112, 44, 108, 36, 90);
    ctx.bezierCurveTo(28, 70, 42, 54, 52, 60);
    ctx.bezierCurveTo(48, 40, 56, 26, 64, 14);
    ctx.closePath();
    ctx.fill();
  },
  // взрыв — рваная вспышка
  explosion: (ctx) => {
    polyStar(ctx, 64, 64, 9, 48, 22);
    ctx.fill();
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(64, 64, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  },
  // поджог — клеймо из пламени с тлеющим кольцом
  ignite: (ctx) => {
    ctx.beginPath();
    ctx.arc(64, 70, 40, Math.PI * 0.1, Math.PI * 0.9);
    stroke(ctx, 8);
    ctx.beginPath();
    ctx.moveTo(64, 18);
    ctx.bezierCurveTo(90, 48, 88, 66, 76, 80);
    ctx.bezierCurveTo(64, 92, 46, 88, 42, 72);
    ctx.bezierCurveTo(38, 58, 50, 50, 56, 56);
    ctx.bezierCurveTo(54, 40, 58, 28, 64, 18);
    ctx.closePath();
    ctx.fill();
  },
  // огненный шар — ядро с хвостом
  fireball: (ctx) => {
    ctx.beginPath();
    ctx.arc(78, 62, 30, 0, Math.PI * 2);
    ctx.fill();
    path(ctx, [
      [48, 44],
      [10, 30],
    ]);
    stroke(ctx, 8);
    path(ctx, [
      [46, 62],
      [4, 62],
    ]);
    stroke(ctx, 10);
    path(ctx, [
      [48, 80],
      [10, 94],
    ]);
    stroke(ctx, 8);
  },
  // детонация — три вспышки цепочкой
  detonate: (ctx) => {
    for (const [x, y, r] of [
      [34, 40, 16],
      [64, 70, 24],
      [96, 44, 13],
    ]) {
      polyStar(ctx, x, y, 8, r * 2, r);
      ctx.fill();
    }
  },
  // инферно — стена пламени
  inferno: (ctx) => {
    for (const [x, h] of [
      [30, 34],
      [64, 14],
      [98, 40],
    ]) {
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.bezierCurveTo(x + 24, h + 34, x + 20, h + 54, x + 10, h + 64);
      ctx.bezierCurveTo(x - 4, h + 74, x - 24, h + 62, x - 22, h + 42);
      ctx.bezierCurveTo(x - 20, h + 28, x - 8, h + 26, x - 6, h + 32);
      ctx.bezierCurveTo(x - 8, h + 16, x - 4, h + 8, x, h);
      ctx.closePath();
      ctx.fill();
    }
  },
  // взрыв плоти — череп в кольце брызг
  corpse: (ctx) => {
    ctx.beginPath();
    ctx.arc(64, 58, 28, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(36, 58, 56, 22);
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8;
      path(ctx, [
        [64 + Math.cos(a) * 44, 64 + Math.sin(a) * 44],
        [64 + Math.cos(a) * 58, 64 + Math.sin(a) * 58],
      ]);
      stroke(ctx, 7);
    }
  },
  // призрачные слуги — привидение с волнистым подолом
  ghost: (ctx) => {
    ctx.beginPath();
    ctx.arc(64, 54, 28, Math.PI, 0);
    ctx.lineTo(92, 96);
    ctx.quadraticCurveTo(83, 82, 74, 96);
    ctx.quadraticCurveTo(64, 82, 54, 96);
    ctx.quadraticCurveTo(45, 82, 36, 96);
    ctx.closePath();
    ctx.fill();
  },
  // кукла вуду — фигурка, пронзённая иглой
  voodoo: (ctx) => {
    ctx.beginPath();
    ctx.arc(64, 34, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(54, 52, 20, 40);
    path(ctx, [
      [30, 62],
      [98, 62],
    ]);
    stroke(ctx, 9);
    path(ctx, [
      [54, 92],
      [44, 112],
    ]);
    stroke(ctx, 9);
    path(ctx, [
      [74, 92],
      [84, 112],
    ]);
    stroke(ctx, 9);
  },
  // жатва душ — коса: почти отвесное древко и широкий серп сверху
  harvest: (ctx) => {
    path(ctx, [
      [84, 22],
      [56, 114],
    ]);
    stroke(ctx, 10);
    ctx.beginPath();
    ctx.moveTo(88, 24);
    ctx.quadraticCurveTo(40, 8, 12, 56);
    ctx.quadraticCurveTo(24, 40, 52, 38);
    ctx.quadraticCurveTo(74, 38, 84, 46);
    ctx.closePath();
    ctx.fill();
  },
  // свет — солнце с лучами
  holy: (ctx) => {
    ctx.beginPath();
    ctx.arc(64, 64, 22, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI / 4) * i;
      path(ctx, [
        [64 + Math.cos(a) * 32, 64 + Math.sin(a) * 32],
        [64 + Math.cos(a) * 48, 64 + Math.sin(a) * 48],
      ]);
      stroke(ctx, 8);
    }
  },
  // знамя — флаг на древке
  banner: (ctx) => {
    ctx.fillRect(38, 16, 8, 96);
    path(
      ctx,
      [
        [46, 22],
        [102, 22],
        [88, 46],
        [102, 70],
        [46, 70],
      ],
      true,
    );
    ctx.fill();
  },
  // тьма — щупальца из тени
  dark: (ctx) => {
    ctx.beginPath();
    ctx.arc(64, 70, 26, Math.PI, 0);
    ctx.fill();
    for (let i = 0; i < 5; i++) {
      const a = Math.PI + (Math.PI / 4) * (i - 2) * 0.9;
      path(ctx, [
        [64, 70],
        [64 + Math.cos(a) * 46, 70 + Math.sin(a) * 46],
      ]);
      stroke(ctx, 9);
    }
    ctx.fillRect(38, 70, 52, 14);
  },
  // души — огонёк с хвостом
  soul: (ctx) => {
    ctx.beginPath();
    ctx.arc(64, 52, 24, Math.PI, 0);
    ctx.bezierCurveTo(88, 86, 76, 96, 64, 110);
    ctx.bezierCurveTo(52, 96, 40, 86, 40, 52);
    ctx.closePath();
    ctx.fill();
  },
  // клеймо — прицел
  mark: (ctx) => {
    ctx.beginPath();
    ctx.arc(64, 64, 38, 0, Math.PI * 2);
    stroke(ctx, 8);
    ctx.beginPath();
    ctx.arc(64, 64, 10, 0, Math.PI * 2);
    ctx.fill();
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      path(ctx, [
        [64 + dx * 34, 64 + dy * 34],
        [64 + dx * 54, 64 + dy * 54],
      ]);
      stroke(ctx, 8);
    }
  },
  // землетрясение — трещина
  quake: (ctx) => {
    ctx.fillRect(22, 84, 84, 10);
    path(ctx, [
      [46, 84],
      [60, 54],
      [52, 52],
      [72, 20],
    ]);
    stroke(ctx, 9);
    path(ctx, [
      [84, 84],
      [92, 62],
    ]);
    stroke(ctx, 7);
  },
  // удар — четырёхлучевая вспышка
  slam: (ctx) => {
    polyStar(ctx, 64, 64, 4, 50, 12);
    ctx.fill();
  },
  // клинки — скрещённые росчерки
  blades: (ctx) => {
    path(ctx, [
      [26, 26],
      [102, 102],
    ]);
    stroke(ctx, 11);
    path(ctx, [
      [102, 26],
      [26, 102],
    ]);
    stroke(ctx, 11);
  },
  // выстрел — стрела вправо
  shot: (ctx) => {
    path(ctx, [
      [18, 64],
      [86, 64],
    ]);
    stroke(ctx, 10);
    path(
      ctx,
      [
        [110, 64],
        [76, 44],
        [82, 64],
        [76, 84],
      ],
      true,
    );
    ctx.fill();
  },
  // ливень стрел — три стрелы вниз
  arrows: (ctx) => {
    for (const x of [36, 64, 92]) {
      path(ctx, [
        [x, 16],
        [x, 84],
      ]);
      stroke(ctx, 8);
      path(
        ctx,
        [
          [x, 110],
          [x - 15, 80],
          [x, 86],
          [x + 15, 80],
        ],
        true,
      );
      ctx.fill();
    }
  },
  // дым — облако
  smoke: (ctx) => {
    for (const [x, y, r] of [
      [46, 74, 22],
      [70, 68, 26],
      [90, 80, 18],
      [58, 88, 20],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  // перестановка — две стрелки навстречу друг другу
  swap: (ctx) => {
    arcArrow(ctx, 64, 64, 34, Math.PI * 1.15, Math.PI * 1.85, 10);
    arcArrow(ctx, 64, 64, 34, Math.PI * 0.15, Math.PI * 0.85, 10);
  },
  // откат времени — круговая стрелка назад плюс стрелка-указатель
  rewind: (ctx) => {
    ctx.beginPath();
    ctx.arc(64, 64, 36, Math.PI * 0.75, Math.PI * 2.15);
    stroke(ctx, 10);
    path(
      ctx,
      [
        [36, 26],
        [40, 66],
        [4, 50],
      ],
      true,
    );
    ctx.fill();
  },
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
  bakeSprite(scene, 'spr_exit', ITEM_ART.exit);
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

  // --- иконки перков: рисунок по семейству эффекта, рамка по линейке, золото у легендарных
  for (const p of PERKS) {
    const col = LINEAGE_COLOR[CLASSES[p.classId].lineage];
    const fxCol = VFX_COLOR[p.vfx] ?? col;
    canvasTex(scene, p.icon, 128, 128, (ctx) => {
      const legend = p.slot === 'legend';
      const g = ctx.createRadialGradient(64, 54, 6, 64, 64, 62);
      g.addColorStop(0, legend ? '#5a3f9a' : '#343948');
      g.addColorStop(1, '#14161c');
      ctx.fillStyle = g;
      rr(ctx, 6, 6, 116, 116, 34);
      ctx.fill();
      ctx.lineWidth = legend ? 8 : 6;
      ctx.strokeStyle = legend ? '#f5c518' : col;
      ctx.stroke();
      ctx.save();
      rr(ctx, 10, 10, 108, 108, 30);
      ctx.clip();
      ctx.translate(64, 64);
      ctx.scale(0.86, 0.86);
      ctx.translate(-64, -64);
      ctx.fillStyle = fxCol;
      ctx.strokeStyle = fxCol;
      ctx.shadowColor = fxCol;
      ctx.shadowBlur = 10;
      VFX_GLYPH[p.vfx](ctx);
      ctx.restore();
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

  // --- частицы для VFX способностей: мягкая точка, язык пламени и стрела
  canvasTex(scene, 'dot', 32, 32, (ctx) => {
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.65)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
  });
  canvasTex(scene, 'flame', 48, 72, (ctx) => {
    // капля-язычок: широкое основание, острый верх
    ctx.beginPath();
    ctx.moveTo(24, 2);
    ctx.bezierCurveTo(40, 26, 46, 42, 40, 55);
    ctx.bezierCurveTo(35, 68, 13, 68, 8, 55);
    ctx.bezierCurveTo(2, 42, 8, 26, 24, 2);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, 72, 0, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.75)');
    g.addColorStop(1, 'rgba(255,255,255,1)');
    ctx.fillStyle = g;
    ctx.fill();
  });
  canvasTex(scene, 'arrow_vfx', 64, 20, (ctx) => {
    ctx.fillStyle = '#ffffff';
    // наконечник справа, древко слева, оперение «ёлочкой»
    ctx.beginPath();
    ctx.moveTo(64, 10);
    ctx.lineTo(44, 2);
    ctx.lineTo(48, 10);
    ctx.lineTo(44, 18);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(6, 8, 42, 4);
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.lineTo(14, 10);
    ctx.lineTo(0, 18);
    ctx.lineTo(5, 10);
    ctx.closePath();
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
      const rg = ctx.createRadialGradient(
        CARD_W / 2,
        wy + wh * 0.55,
        6,
        CARD_W / 2,
        wy + wh * 0.55,
        ww * 0.62,
      );
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
  frame('card_exit', '#f0c75e', 'rgba(240,199,94,0.30)', true);
  frame('card_ghost', '#a9e8ff', 'rgba(169,232,255,0.26)', true);

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
    const rnd = (): number => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
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
