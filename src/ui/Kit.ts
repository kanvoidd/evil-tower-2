import Phaser from 'phaser';
import { COLOR, FONT_TITLE, FONT_UI, GAME_H, GAME_W, HEX, TIMING } from '../config';
import { AUDIO, type SfxName } from '../systems/Audio';
import { Store } from '../systems/Store';
import { fmt, t, tr } from '../i18n';
import { ACHIEVEMENTS } from '../data/achievements';
import { statHex } from './Textures';

// ---------------------------------------------------------------------------------- текст

export interface TxtOpts {
  color?: string;
  stroke?: string;
  strokeThickness?: number;
  align?: 'left' | 'center' | 'right';
  wrap?: number;
  origin?: [number, number];
  /** 'ui' — Nunito (по умолчанию), 'title' — Alegreya SC (заголовки, логотип). */
  font?: 'ui' | 'title';
  weight?: 700 | 800 | 900;
  /** Совместимость: false = более лёгкое начертание. */
  bold?: boolean;
  lineSpacing?: number;
  /** Уменьшать шрифт, пока строка не влезет в ширину. */
  maxWidth?: number;
}

export const txt = (
  scene: Phaser.Scene, x: number, y: number, text: string, size = 26, o: TxtOpts = {},
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

export const icon = (
  scene: Phaser.Scene, x: number, y: number, key: string, size: number, tint?: number,
): Phaser.GameObjects.Image => {
  const img = scene.add.image(x, y, key);
  img.setDisplaySize(size, size * (img.height / img.width));
  if (tint !== undefined) img.setTint(tint);
  return img;
};

// ---------------------------------------------------------------------------------- панели

export type PlateStyle = 'panel' | 'raised' | 'gold' | 'red' | 'green' | 'dark' | 'glass' | 'stone';

interface PanelSpec {
  top: string;
  bottom: string;
  border: string;
  hi: string;
}

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

// ---------------------------------------------------------------------------------- анимации

export const pulse = (
  scene: Phaser.Scene, target: Phaser.GameObjects.GameObject, cycleMs: number, scale: number, delay = 0,
): Phaser.Tweens.Tween =>
  scene.tweens.add({
    targets: target,
    scaleX: scale,
    scaleY: scale,
    duration: cycleMs / 2,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
    delay,
  });

export const popIn = (scene: Phaser.Scene, target: Phaser.GameObjects.GameObject, delay = 0, from = 0.6): void => {
  (target as any).setScale?.(from);
  (target as any).setAlpha?.(0);
  scene.tweens.add({ targets: target, scaleX: 1, scaleY: 1, alpha: 1, duration: 260, delay, ease: 'Back.easeOut' });
};

/** Редкие тёплые искры на фоне — живая, но спокойная атмосфера. */
export const addEmbers = (scene: Phaser.Scene, count = 12): void => {
  for (let i = 0; i < count; i++) {
    const s = scene.add.image(0, 0, 'glow').setTint(0xffb56b).setBlendMode(Phaser.BlendModes.ADD).setDepth(-50).setScrollFactor(0).setAlpha(0);
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

// ---------------------------------------------------------------------------------- кнопка

export interface BtnOpts {
  w: number;
  h: number;
  label?: string;
  fontSize?: number;
  font?: 'ui' | 'title';
  icon?: string;
  iconSize?: number;
  pulse?: { cycle: number; scale: number };
  style?: PlateStyle;
  onClick?: () => void;
  sound?: SfxName | null;
  labelColor?: string;
  radius?: number;
  shadow?: boolean;
  /** Вторая строка под подписью (мелким шрифтом). */
  sub?: string;
  subColor?: string;
  /** Оставлено для совместимости (раньше кнопки наклонялись). */
  angle?: number;
  seed?: number;
}

/** Светлые иконки на тёмных кнопках, чёрные — на золотых. */
const iconFor = (key: string, style: PlateStyle): string =>
  key.startsWith('svg_') && style !== 'gold' ? key.replace('svg_', 'svgw_') : key;

export class PlateButton extends Phaser.GameObjects.Container {
  readonly pressC: Phaser.GameObjects.Container;
  readonly pulseC: Phaser.GameObjects.Container;
  plate: Phaser.GameObjects.Image;
  labelText?: Phaser.GameObjects.Text;
  subText?: Phaser.GameObjects.Text;
  iconImg?: Phaser.GameObjects.Image;
  private shadowImg?: Phaser.GameObjects.Image;
  private badge?: Phaser.GameObjects.Container;
  private downPos: { x: number; y: number } | null = null;
  /** Ставится подсказкой при долгом нажатии: следующее отпускание не считается нажатием на кнопку. */
  swallowClick = false;
  private onClick?: () => void;
  private soundName: SfxName | null;
  private locked = false;
  private onLocked?: () => void;
  private style: PlateStyle;
  private iconSize = 0;
  private radius: number;
  readonly bw: number;
  readonly bh: number;

  constructor(scene: Phaser.Scene, x: number, y: number, o: BtnOpts) {
    super(scene, x, y);
    this.bw = o.w;
    this.bh = o.h;
    this.style = o.style ?? 'raised';
    this.radius = o.radius ?? Math.min(24, Math.round(o.h * 0.3));
    this.onClick = o.onClick;
    this.soundName = o.sound === undefined ? 'click' : o.sound;
    this.pressC = scene.add.container(0, 0);
    this.pulseC = scene.add.container(0, 0);
    if (o.shadow !== false) {
      this.shadowImg = scene.add.image(0, 7, shadowTexture(scene, o.w, o.h, this.radius, 12)).setAlpha(0.9);
      this.add(this.shadowImg);
    }
    this.add(this.pressC);
    this.pressC.add(this.pulseC);
    this.plate = scene.add.image(0, 0, plateTexture(scene, o.w, o.h, 1, this.style, this.radius));
    this.pulseC.add(this.plate);

    if (o.icon) {
      this.iconSize = o.iconSize ?? Math.round(Math.min(o.w, o.h) * 0.5);
      this.iconImg = icon(scene, 0, 0, iconFor(o.icon, this.style), this.iconSize);
      this.pulseC.add(this.iconImg);
    }
    if (o.label !== undefined) {
      const dark = this.style === 'gold';
      this.labelText = txt(scene, 0, 0, o.label, o.fontSize ?? 28, {
        font: o.font ?? 'ui',
        color: o.labelColor ?? (dark ? '#2b1c06' : HEX.text),
        strokeThickness: dark ? 0 : undefined,
        stroke: HEX.dark,
      });
      this.pulseC.add(this.labelText);
    }
    if (o.sub !== undefined) {
      const subDefault: Record<string, string> = { gold: '#5a3d0e', green: '#e2fbec', red: '#ffe3e0' };
      this.subText = txt(scene, 0, 0, o.sub, 19, {
        color: o.subColor ?? subDefault[this.style] ?? HEX.textDim, strokeThickness: 0, weight: 700,
      });
      this.pulseC.add(this.subText);
    }
    this.layout();

    this.setSize(o.w, o.h);
    // У контейнеров область попадания задаётся от левого верхнего угла (сдвиг displayOrigin = размер/2).
    this.setInteractive(new Phaser.Geom.Rectangle(0, 0, o.w, o.h), Phaser.Geom.Rectangle.Contains);
    if (o.pulse) pulse(scene, this.pulseC, o.pulse.cycle, o.pulse.scale);

    this.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.downPos = { x: p.x, y: p.y };
      scene.tweens.killTweensOf(this.pressC);
      scene.tweens.add({ targets: this.pressC, scaleX: 0.965, scaleY: 0.965, y: 2, duration: 70 });
    });
    this.on('pointerout', () => {
      this.downPos = null;
      this.release();
    });
    this.on('pointerup', (p: Phaser.Input.Pointer) => {
      const d = this.downPos ? Phaser.Math.Distance.Between(p.x, p.y, this.downPos.x, this.downPos.y) : 999;
      this.downPos = null;
      this.release();
      // долгое нажатие показало подсказку (см. tipOnHover) — само действие кнопки не выполняем
      if (this.swallowClick) {
        this.swallowClick = false;
        return;
      }
      if (d > 22) return;
      if (this.locked) {
        AUDIO.play('error');
        this.shake();
        this.onLocked?.();
        return;
      }
      if (this.soundName) AUDIO.play(this.soundName);
      this.onClick?.();
    });
    scene.add.existing(this);
  }

  /** Иконка + подпись центрируются как единая группа. */
  private layout(): void {
    const hasText = !!(this.labelText || this.subText);
    const gap = this.iconImg && hasText ? 14 : 0;
    const iw = this.iconImg ? this.iconSize : 0;
    const room = this.bw - 32 - iw - gap;
    if (this.labelText) fitText(this.labelText, room);
    if (this.subText) fitText(this.subText, room);
    const tw = Math.max(this.labelText?.width ?? 0, this.subText?.width ?? 0);
    const total = iw + gap + tw;
    let cx = -total / 2;
    if (this.iconImg) {
      this.iconImg.setPosition(cx + iw / 2, 0);
      cx += iw + gap;
    }
    const mid = cx + tw / 2;
    if (this.labelText) this.labelText.setPosition(mid, this.subText ? -13 : -1);
    if (this.subText) this.subText.setPosition(mid, 21);
  }

  setSub(text: string): this {
    if (this.subText) {
      this.subText.setText(text);
      this.layout();
    }
    return this;
  }

  private release(): void {
    this.scene.tweens.killTweensOf(this.pressC);
    this.scene.tweens.add({ targets: this.pressC, scaleX: 1, scaleY: 1, y: 0, duration: 140, ease: 'Back.easeOut' });
  }

  setOnClick(fn: () => void): this {
    this.onClick = fn;
    return this;
  }

  /** «Заблокированная» кнопка остаётся кликабельной: даёт обратную связь и вызывает onLocked. */
  setLocked(locked: boolean, onLocked?: () => void): this {
    this.locked = locked;
    this.onLocked = onLocked;
    this.pulseC.setAlpha(locked ? 0.55 : 1);
    return this;
  }

  setLabel(text: string): this {
    if (this.labelText) {
      this.labelText.setText(text);
      this.layout();
    }
    return this;
  }

  setIcon(key: string): this {
    if (this.iconImg) {
      this.iconImg.setTexture(iconFor(key, this.style));
      this.iconImg.setDisplaySize(this.iconSize, this.iconSize * (this.iconImg.height / this.iconImg.width));
    }
    return this;
  }

  setStyle(style: PlateStyle): this {
    this.style = style;
    this.plate.setTexture(plateTexture(this.scene, this.bw, this.bh, 1, style, this.radius));
    if (this.labelText) {
      const dark = style === 'gold';
      this.labelText.setColor(dark ? '#2b1c06' : HEX.text);
      this.labelText.setStroke(HEX.dark, dark ? 0 : 4);
    }
    return this;
  }

  setBadge(on: boolean): this {
    if (on && !this.badge) {
      const c = this.scene.add.container(this.bw / 2 - 10, -this.bh / 2 + 10);
      const dot = this.scene.add.circle(0, 0, 13, COLOR.red).setStrokeStyle(3, 0x0b0d12);
      const ex = txt(this.scene, 0, -1, '!', 18, { color: '#ffffff', strokeThickness: 0, weight: 900 });
      c.add([dot, ex]);
      this.badge = c;
      this.pulseC.add(c);
      popIn(this.scene, c);
    } else if (!on && this.badge) {
      this.badge.destroy();
      this.badge = undefined;
    }
    return this;
  }

  shake(): void {
    this.scene.tweens.add({ targets: this.pressC, x: { from: -7, to: 7 }, duration: 55, yoyo: true, repeat: 2, onComplete: () => this.pressC.setX(0) });
  }
}

/**
 * Фиксирует объект и всех его потомков на экране. Нужно, потому что hit-test вложенных объектов
 * использует их собственный scrollFactor: без этого кнопки в панелях не нажимаются при сдвинутой камере.
 */
export const pinToScreen = (o: Phaser.GameObjects.GameObject): void => {
  (o as unknown as { setScrollFactor?: (v: number) => void }).setScrollFactor?.(0);
  if (o instanceof Phaser.GameObjects.Container) o.list.forEach(pinToScreen);
};

// ---------------------------------------------------------------------------------- диалоги

export interface DialogBtn {
  label: string;
  onClick?: () => void;
  style?: PlateStyle;
  /** Не закрывать диалог после нажатия. */
  keep?: boolean;
  icon?: string;
  w?: number;
  /** Получить созданную кнопку (например, чтобы отключить после нажатия). */
  ref?: (btn: PlateButton) => void;
}

export interface DialogOpts {
  title: string;
  body?: string;
  width?: number;
  content?: (scene: Phaser.Scene, c: Phaser.GameObjects.Container, width: number) => number;
  buttons: DialogBtn[];
  closeOnBackdrop?: boolean;
  /** Кнопки столбцом (для окон с тремя и более действиями). */
  vertical?: boolean;
  titleColor?: string;
}

export class Dialog extends Phaser.GameObjects.Container {
  private closed = false;

  constructor(scene: Phaser.Scene, o: DialogOpts) {
    super(scene, GAME_W / 2, GAME_H / 2);
    this.setDepth(1000).setScrollFactor(0);
    hideTip(scene);
    const width = o.width ?? 600;
    const pad = 40;
    const dim = scene.add.rectangle(0, 0, GAME_W * 2, GAME_H * 2, 0x05060a, 0.78).setInteractive();
    dim.on('pointerup', () => o.closeOnBackdrop && this.close());
    this.add(dim);

    const inner = scene.add.container(0, 0);
    this.add(inner);
    let y = pad;
    const title = txt(scene, 0, 0, o.title, 40, { font: 'title', color: o.titleColor ?? HEX.gold, wrap: width - pad * 2 });
    title.setPosition(0, y + title.height / 2);
    inner.add(title);
    y += title.height + 12;
    inner.add(scene.add.image(0, y, 'px').setTint(COLOR.gold).setAlpha(0.7).setDisplaySize(84, 3));
    y += 26;
    if (o.body) {
      const body = txt(scene, 0, 0, o.body, 25, { wrap: width - pad * 2, color: HEX.textDim, weight: 700, strokeThickness: 0 });
      body.setPosition(0, y + body.height / 2);
      inner.add(body);
      y += body.height + 24;
    }
    if (o.content) {
      const holder = scene.add.container(0, y);
      inner.add(holder);
      y += o.content(scene, holder, width) + 20;
    }
    const vertical = !!o.vertical;
    const n = o.buttons.length;
    const btnH = vertical ? 76 : 80;
    const gap = 16;
    const btnW = vertical
      ? Math.min(480, width - pad * 2)
      : n > 1 ? (width - pad * 2 - gap * (n - 1)) / n : Math.min(380, width - pad * 2);
    const rows = vertical ? n : 1;
    const total = y + rows * btnH + (rows - 1) * gap + pad;
    inner.addAt(scene.add.image(0, 0, shadowTexture(scene, width, total, 30, 26)).setAlpha(0.9), 0);
    const plate = scene.add.image(0, 0, plateTexture(scene, width, total, 1, 'panel', 30));
    inner.addAt(plate, 1);
    inner.each((ch: Phaser.GameObjects.GameObject) => {
      if ((ch as any) !== plate) (ch as any).y -= total / 2;
    });
    // тень и плита изначально в центре; подложка выше сдвигается вместе с остальными, поэтому вернём их
    (inner.list[0] as Phaser.GameObjects.Image).y = 10;
    plate.y = 0;
    o.buttons.forEach((b, i) => {
      const bw = b.w ?? btnW;
      const bx = vertical ? 0 : -((n - 1) * (btnW + gap)) / 2 + i * (btnW + gap);
      const by = (vertical ? y + btnH / 2 + i * (btnH + gap) : y + btnH / 2) - total / 2;
      const btn = new PlateButton(scene, bx, by, {
        w: bw, h: btnH, label: b.label, fontSize: 27, icon: b.icon, style: b.style ?? 'raised', radius: 22,
        onClick: () => {
          if (!b.keep) this.close();
          b.onClick?.();
        },
      });
      inner.add(btn);
      b.ref?.(btn);
    });
    pinToScreen(this);
    scene.add.existing(this);
    inner.setScale(0.9).setAlpha(0);
    dim.setAlpha(0);
    scene.tweens.add({ targets: inner, scaleX: 1, scaleY: 1, alpha: 1, duration: 220, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: dim, alpha: 0.78, duration: 200 });
    AUDIO.play('open');
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    hideTip(this.scene);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 140,
      onComplete: () => this.destroy(),
    });
  }
}

// ---------------------------------------------------------------------------------- тост

const toastSlots: boolean[] = [];

export const toast = (scene: Phaser.Scene, text: string, iconKey?: string): void => {
  let slot = toastSlots.findIndex((used) => !used);
  if (slot < 0) slot = toastSlots.length;
  toastSlots[slot] = true;
  const y = 84 + slot * 84;
  const c = scene.add.container(GAME_W / 2, -80).setDepth(2000).setScrollFactor(0);
  const label = txt(scene, 0, 0, text, 24, { wrap: 480, strokeThickness: 0 });
  const iw = iconKey ? 52 : 0;
  const w = Math.min(640, label.width + 64 + iw);
  const h = 68;
  c.add(scene.add.image(0, 8, shadowTexture(scene, w, h, 34, 14)).setAlpha(0.9));
  c.add(scene.add.image(0, 0, plateTexture(scene, w, h, 1, 'panel', 34)));
  c.add(scene.add.rectangle(-w / 2 + 14, 0, 4, h - 30, COLOR.gold).setAlpha(0.9));
  label.setPosition(iw / 2 + 4, -1);
  c.add(label);
  if (iconKey) c.add(icon(scene, -w / 2 + 50, 0, iconKey.startsWith('svg_') ? iconKey.replace('svg_', 'svgw_') : iconKey, 38));
  scene.tweens.add({
    targets: c,
    y,
    duration: 320,
    ease: 'Back.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: c, y: -100, alpha: 0, delay: 2200, duration: 300,
        onComplete: () => {
          toastSlots[slot] = false;
          c.destroy();
        },
      });
    },
  });
  scene.events.once('shutdown', () => {
    toastSlots[slot] = false;
  });
  AUDIO.play('reward');
};

/** Показывает тост при получении достижения, пока сцена активна. */
export const bindToasts = (scene: Phaser.Scene): void => {
  const fn = (id: string): void => {
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (a) toast(scene, t('toast.achievement', { name: tr(a.name) }), 'svg_trophy');
  };
  Store.events.on('achievement', fn);
  scene.events.once('shutdown', () => Store.events.off('achievement', fn));
};

// ---------------------------------------------------------------------------------- значки характеристик

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

export interface Pill {
  c: Phaser.GameObjects.Container;
  setText: (s: string) => void;
  setTextColor: (hex: string) => void;
}

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

// ---------------------------------------------------------------------------------- переключатель и подсказки

interface TipState {
  c: Phaser.GameObjects.Container;
  owner: unknown;
  timer: Phaser.Time.TimerEvent;
}

const tips = new WeakMap<Phaser.Scene, TipState>();
const tipHooked = new WeakSet<Phaser.Scene>();

/** Прячет подсказку (если задан owner — только его собственную). */
export const hideTip = (scene: Phaser.Scene, owner?: unknown): void => {
  const cur = tips.get(scene);
  if (!cur || (owner !== undefined && cur.owner !== owner)) return;
  tips.delete(scene);
  cur.timer.remove();
  scene.tweens.add({ targets: cur.c, alpha: 0, duration: 120, onComplete: () => cur.c.destroy() });
};

/**
 * Подсказка-облачко возле якоря (экранные координаты). Появляется над якорем, а если места нет — под ним;
 * исчезает через несколько секунд или по следующему нажатию.
 */
export const showTip = (
  scene: Phaser.Scene, text: string, anchor: { x: number; y: number }, owner: unknown = null,
  o: { gap?: number; maxW?: number; ttl?: number } = {},
): void => {
  hideTip(scene);
  const maxW = o.maxW ?? 470;
  const gap = o.gap ?? 30;
  const label = txt(scene, 0, 0, text, 22, { wrap: maxW, weight: 700, strokeThickness: 0, align: 'left', origin: [0, 0] });
  const padX = 22;
  const padY = 16;
  const w = label.width + padX * 2;
  const h = label.height + padY * 2;
  const c = scene.add.container(0, 0).setDepth(3000).setScrollFactor(0);
  c.add(scene.add.image(0, 7, shadowTexture(scene, w, h, 20, 14)).setAlpha(0.9));
  c.add(scene.add.image(0, 0, plateTexture(scene, w, h, 1, 'raised', 20)));
  label.setPosition(-w / 2 + padX, -h / 2 + padY);
  c.add(label);
  let cy = anchor.y - gap - h / 2;
  const below = cy - h / 2 < 12;
  if (below) cy = anchor.y + gap + h / 2;
  const cx = Phaser.Math.Clamp(anchor.x, 12 + w / 2, GAME_W - 12 - w / 2);
  c.setPosition(cx, cy);
  const px = Phaser.Math.Clamp(anchor.x - cx, -w / 2 + 28, w / 2 - 28);
  const tail = scene.add.graphics();
  if (below) tail.fillStyle(0x40476a, 1).fillTriangle(px - 11, -h / 2 + 1, px + 11, -h / 2 + 1, px, -h / 2 - 11);
  else tail.fillStyle(0x2a2f49, 1).fillTriangle(px - 11, h / 2 - 1, px + 11, h / 2 - 1, px, h / 2 + 11);
  c.add(tail);
  pinToScreen(c);
  c.setAlpha(0);
  scene.tweens.add({ targets: c, alpha: 1, duration: 140 });
  const timer = scene.time.delayedCall(o.ttl ?? 5200, () => hideTip(scene, owner));
  tips.set(scene, { c, owner, timer });
  if (!tipHooked.has(scene)) {
    tipHooked.add(scene);
    // сцена переиспользуется при перезапуске: старую подсказку нужно забыть вместе с её объектами
    scene.events.on('shutdown', () => tips.delete(scene));
  }
  // следующее нажатие где угодно закрывает подсказку (регистрируем чуть позже, чтобы не сработало от текущего)
  scene.time.delayedCall(60, () => scene.input?.once('pointerdown', () => hideTip(scene)));
};

/**
 * Подсказка для интерактивного объекта: на компьютере — при наведении мыши, на телефоне — при долгом нажатии
 * (обычное короткое нажатие работает как раньше; после долгого нажатия действие кнопки не срабатывает).
 */
export const tipOnHover = (scene: Phaser.Scene, obj: Phaser.GameObjects.Container, tip: string | (() => string)): void => {
  const text = (): string => (typeof tip === 'string' ? tip : tip());
  const show = (): void => {
    const b = obj.getBounds();
    showTip(scene, text(), { x: b.centerX, y: b.top }, obj, { gap: 12 });
  };
  let hold: Phaser.Time.TimerEvent | null = null;
  const cancelHold = (): void => {
    hold?.remove();
    hold = null;
  };
  obj.on('pointerover', (p: Phaser.Input.Pointer) => {
    if (!p.wasTouch) show();
  });
  obj.on('pointerout', () => {
    cancelHold();
    hideTip(scene, obj);
  });
  obj.on('pointerdown', (p: Phaser.Input.Pointer) => {
    hideTip(scene, obj);
    if (!p.wasTouch) return;
    cancelHold();
    hold = scene.time.delayedCall(450, () => {
      hold = null;
      show();
      (obj as { swallowClick?: boolean }).swallowClick = true;
    });
  });
  obj.on('pointerup', (p: Phaser.Input.Pointer) => {
    cancelHold();
    // после нажатия подсказка обновляется: мышь всё ещё над кнопкой — показываем актуальное состояние («Сейчас включено…»)
    hideTip(scene, obj);
    if (!p.wasTouch) show();
  });
};

/** Мягкий указатель для обучения. */
export const tapHint = (scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container => {
  const c = scene.add.container(x, y).setDepth(1500);
  const ring = scene.add.circle(0, 0, 30, 0xffffff, 0).setStrokeStyle(4, COLOR.glow);
  const finger = scene.add.triangle(0, 44, 0, 0, 34, 0, 17, -30, COLOR.glow).setStrokeStyle(3, 0x0b0d12).setOrigin(0.5, 0);
  c.add([ring, finger]);
  scene.tweens.add({ targets: ring, scale: { from: 0.6, to: 1.6 }, alpha: { from: 1, to: 0 }, duration: 1100, repeat: -1 });
  scene.tweens.add({ targets: finger, y: 58, duration: 850, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  return c;
};

// ---------------------------------------------------------------------------------- HUD: валюта и звук

export interface CurrencyOpts {
  /** Значения задаются вручную (добыча за комнату), а не берутся из кошелька. */
  manual?: boolean;
  goldIcon?: string;
  compact?: boolean;
}

/** Золото и опыт душ: значок + число, без рамки и подложки. x — правый край блока. */
export class CurrencyBar extends Phaser.GameObjects.Container {
  private goldText: Phaser.GameObjects.Text;
  private soulText: Phaser.GameObjects.Text;
  private goldIcon: Phaser.GameObjects.Image;
  private soulIcon: Phaser.GameObjects.Image;
  private shownGold: number;
  private shownSouls: number;
  private readonly manual: boolean;
  private readonly iconSize: number;

  constructor(scene: Phaser.Scene, x: number, y: number, o: CurrencyOpts = {}) {
    super(scene, x, y);
    this.manual = !!o.manual;
    const fs = o.compact ? 28 : 32;
    this.iconSize = o.compact ? 34 : 38;
    const gap = o.compact ? 40 : 46;
    this.shownGold = this.manual ? 0 : Store.gold;
    this.shownSouls = this.manual ? 0 : Store.souls;
    this.goldText = txt(scene, 0, 0, fmt(this.shownGold), fs, { origin: [1, 0.5], color: HEX.gold, weight: 900 });
    this.soulText = txt(scene, 0, gap, fmt(this.shownSouls), fs, { origin: [1, 0.5], color: HEX.soul, weight: 900 });
    this.goldIcon = icon(scene, 0, 0, o.goldIcon ?? 'ico_gold', this.iconSize);
    this.soulIcon = icon(scene, 0, gap, 'ico_soul', this.iconSize);
    this.add([this.goldIcon, this.soulIcon, this.goldText, this.soulText]);
    this.place();
    if (!this.manual) {
      Store.events.on('wallet', this.refresh, this);
      this.once(Phaser.GameObjects.Events.DESTROY, () => Store.events.off('wallet', this.refresh, this));
    }
    scene.add.existing(this);
  }

  private place(): void {
    this.goldIcon.x = -this.goldText.width - 10 - this.iconSize / 2;
    this.soulIcon.x = -this.soulText.width - 10 - this.iconSize / 2;
  }

  /** Для вручную заданных значений (сумка с золотом и души за комнату). */
  setValues(gold: number, souls: number): void {
    this.tick(this.goldText, this.shownGold, gold, (v) => (this.shownGold = v));
    this.tick(this.soulText, this.shownSouls, souls, (v) => (this.shownSouls = v));
  }

  /** Мировые координаты значков — цель для «полёта» монет. */
  iconWorld(kind: 'gold' | 'souls'): { x: number; y: number } {
    const i = kind === 'gold' ? this.goldIcon : this.soulIcon;
    return { x: this.x + i.x, y: this.y + i.y };
  }

  private refresh(): void {
    this.tick(this.goldText, this.shownGold, Store.gold, (v) => (this.shownGold = v));
    this.tick(this.soulText, this.shownSouls, Store.souls, (v) => (this.shownSouls = v));
  }

  private tick(text: Phaser.GameObjects.Text, from: number, to: number, set: (v: number) => void): void {
    if (!this.scene || from === to) return;
    const obj = { v: from };
    this.scene.tweens.add({
      targets: obj,
      v: to,
      duration: Math.min(600, 150 + Math.abs(to - from) * 6),
      onUpdate: () => {
        set(obj.v);
        text.setText(fmt(obj.v));
        this.place();
      },
      onComplete: () => {
        set(to);
        text.setText(fmt(to));
        this.place();
      },
    });
    if (to > from) this.scene.tweens.add({ targets: text, scale: 1.18, duration: 110, yoyo: true });
  }
}

export const soundButton = (scene: Phaser.Scene, x: number, y: number, size = 64): PlateButton => {
  const btn = new PlateButton(scene, x, y, {
    w: size, h: size, icon: Store.data.muted ? 'svg_sound_off' : 'svg_sound', iconSize: size * 0.56, radius: 18,
    onClick: () => {
      Store.data.muted = !Store.data.muted;
      AUDIO.setMuted(Store.data.muted);
      Store.setAudio(Store.data.volume, Store.data.muted);
      btn.setIcon(Store.data.muted ? 'svg_sound_off' : 'svg_sound');
    },
  });
  return btn;
};

export const closeButton = (scene: Phaser.Scene, onClick: () => void, x = GAME_W - 66, y = 62): PlateButton =>
  new PlateButton(scene, x, y, { w: 68, h: 68, icon: 'svg_close', iconSize: 30, radius: 20, onClick });

// ---------------------------------------------------------------------------------- панорамирование и скроллбар

export interface PanBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

const BAR_COLOR = 0xaab0cc;

/**
 * Перемещение по «холсту» (skill-tree): перетаскивание, колесо мыши, стрелки,
 * инерция и полосы прокрутки. Камера не масштабируется, поэтому UI со scrollFactor(0) остаётся на месте.
 */
export class PanController {
  private cam: Phaser.Cameras.Scene2D.Camera;
  private vel = { x: 0, y: 0 };
  private start: { x: number; y: number; cx: number; cy: number } | null = null;
  private last = { x: 0, y: 0, t: 0 };
  moved = 0;
  private vTrack?: Phaser.GameObjects.Rectangle;
  private vThumb?: Phaser.GameObjects.Rectangle;
  private hTrack?: Phaser.GameObjects.Rectangle;
  private hThumb?: Phaser.GameObjects.Rectangle;
  private thumbDrag: 'v' | 'h' | null = null;
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};

  constructor(
    private scene: Phaser.Scene,
    private bounds: PanBounds,
    readonly zone: Phaser.Geom.Rectangle,
    private axes: 'y' | 'xy' = 'xy',
  ) {
    this.cam = scene.cameras.main;
    const input = scene.input;
    input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (!Phaser.Geom.Rectangle.Contains(this.zone, p.x, p.y) || this.thumbDrag) return;
      this.start = { x: p.x, y: p.y, cx: this.centerX, cy: this.centerY };
      this.last = { x: p.x, y: p.y, t: scene.time.now };
      this.vel = { x: 0, y: 0 };
      this.moved = 0;
    });
    input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.thumbDrag) return this.dragThumb(p);
      if (!this.start || !p.isDown) return;
      const dx = p.x - this.start.x;
      const dy = p.y - this.start.y;
      this.moved = Math.max(this.moved, Math.hypot(dx, dy));
      if (this.moved < 6) return;
      const nx = this.axes === 'xy' ? this.start.cx - dx : this.centerX;
      const ny = this.start.cy - dy;
      const dt = Math.max(1, scene.time.now - this.last.t);
      this.vel = { x: ((this.centerX - nx) * -1000) / dt, y: ((this.centerY - ny) * -1000) / dt };
      this.last = { x: p.x, y: p.y, t: scene.time.now };
      this.setCenter(nx, ny);
    });
    const end = (): void => {
      this.start = null;
      this.thumbDrag = null;
    };
    input.on('pointerup', end);
    input.on('pointerupoutside', end);
    input.on('wheel', (_p: unknown, _o: unknown, dx: number, dy: number) => {
      this.setCenter(this.centerX + (this.axes === 'xy' ? dx : 0), this.centerY + dy);
    });
    if (input.keyboard) {
      this.keys = input.keyboard.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D') as Record<string, Phaser.Input.Keyboard.Key>;
    }
    this.buildBars();
  }

  get centerX(): number {
    return this.cam.scrollX + GAME_W / 2;
  }

  get centerY(): number {
    return this.cam.scrollY + GAME_H / 2;
  }

  get dragging(): boolean {
    return this.moved > 12;
  }

  private clampX(x: number): number {
    const lo = this.bounds.minX + GAME_W / 2;
    const hi = this.bounds.maxX - GAME_W / 2;
    return hi < lo ? (lo + hi) / 2 : Phaser.Math.Clamp(x, lo, hi);
  }

  private clampY(y: number): number {
    const lo = this.bounds.minY + GAME_H / 2;
    const hi = this.bounds.maxY - GAME_H / 2;
    return hi < lo ? (lo + hi) / 2 : Phaser.Math.Clamp(y, lo, hi);
  }

  setCenter(x: number, y: number): void {
    this.cam.centerOn(this.clampX(x), this.clampY(y));
    this.updateBars();
  }

  panTo(x: number, y: number, ms = 450): void {
    const from = { x: this.centerX, y: this.centerY };
    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: ms,
      ease: 'Cubic.easeInOut',
      onUpdate: (tw) => {
        const k = tw.getValue() ?? 0;
        this.setCenter(from.x + (x - from.x) * k, from.y + (y - from.y) * k);
      },
    });
  }

  update(dt: number): void {
    if (!this.start && (Math.abs(this.vel.x) > 8 || Math.abs(this.vel.y) > 8)) {
      this.setCenter(this.centerX + (this.vel.x * dt) / 1000, this.centerY + (this.vel.y * dt) / 1000);
      const f = Math.pow(0.0025, dt / 1000);
      this.vel.x *= f;
      this.vel.y *= f;
    }
    const k = this.keys;
    if (k.UP) {
      const sp = 0.9 * dt;
      const up = k.UP.isDown || k.W.isDown;
      const dn = k.DOWN.isDown || k.S.isDown;
      const lf = k.LEFT.isDown || k.A.isDown;
      const rt = k.RIGHT.isDown || k.D.isDown;
      if (up || dn || lf || rt) {
        this.setCenter(this.centerX + ((rt ? 1 : 0) - (lf ? 1 : 0)) * (this.axes === 'xy' ? sp : 0), this.centerY + ((dn ? 1 : 0) - (up ? 1 : 0)) * sp);
      }
    }
  }

  private buildBars(): void {
    const s = this.scene;
    this.vTrack = s.add.rectangle(GAME_W - 8, 0, 4, 100, 0xffffff, 0.06).setScrollFactor(0).setDepth(900);
    this.vThumb = s.add.rectangle(GAME_W - 8, 0, 6, 60, BAR_COLOR, 0.55).setScrollFactor(0).setDepth(901).setInteractive({ useHandCursor: true });
    this.vThumb.on('pointerdown', () => (this.thumbDrag = 'v'));
    if (this.axes === 'xy') {
      this.hTrack = s.add.rectangle(0, GAME_H - 8, 100, 4, 0xffffff, 0.06).setScrollFactor(0).setDepth(900);
      this.hThumb = s.add.rectangle(0, GAME_H - 8, 60, 6, BAR_COLOR, 0.55).setScrollFactor(0).setDepth(901).setInteractive({ useHandCursor: true });
      this.hThumb.on('pointerdown', () => (this.thumbDrag = 'h'));
    }
    this.updateBars();
  }

  private dragThumb(p: Phaser.Input.Pointer): void {
    const b = this.bounds;
    if (this.thumbDrag === 'v') {
      const t = Phaser.Math.Clamp((p.y - this.zone.y) / this.zone.height, 0, 1);
      this.setCenter(this.centerX, b.minY + GAME_H / 2 + t * (b.maxY - b.minY - GAME_H));
    } else if (this.thumbDrag === 'h') {
      const t = Phaser.Math.Clamp(p.x / GAME_W, 0, 1);
      this.setCenter(b.minX + GAME_W / 2 + t * (b.maxX - b.minX - GAME_W), this.centerY);
    }
  }

  updateBars(): void {
    const b = this.bounds;
    const ww = b.maxX - b.minX;
    const wh = b.maxY - b.minY;
    if (this.vTrack && this.vThumb) {
      const show = wh > GAME_H + 4;
      this.vTrack.setVisible(show);
      this.vThumb.setVisible(show);
      if (show) {
        const zh = this.zone.height;
        this.vTrack.setPosition(GAME_W - 8, this.zone.y + zh / 2).setSize(4, zh);
        const th = Math.max(50, (zh * GAME_H) / wh);
        const t = (this.cam.scrollY - b.minY) / (wh - GAME_H);
        this.vThumb.setSize(6, th).setPosition(GAME_W - 8, this.zone.y + th / 2 + Phaser.Math.Clamp(t, 0, 1) * (zh - th));
      }
    }
    if (this.hTrack && this.hThumb) {
      const show = ww > GAME_W + 4;
      this.hTrack.setVisible(show);
      this.hThumb.setVisible(show);
      if (show) {
        this.hTrack.setPosition(GAME_W / 2, GAME_H - 8).setSize(GAME_W - 40, 4);
        const tw = Math.max(50, ((GAME_W - 40) * GAME_W) / ww);
        const t = (this.cam.scrollX - b.minX) / (ww - GAME_W);
        this.hThumb.setSize(tw, 6).setPosition(20 + tw / 2 + Phaser.Math.Clamp(t, 0, 1) * (GAME_W - 40 - tw), GAME_H - 8);
      }
    }
  }
}

/** Вертикальный список с маской, перетаскиванием, колесом мыши и тонкой полосой прокрутки. */
export class ScrollList {
  readonly content: Phaser.GameObjects.Container;
  private offset = 0;
  private maxOffset = 0;
  private vel = 0;
  private start: { y: number; off: number } | null = null;
  private last = { y: 0, t: 0 };
  private track: Phaser.GameObjects.Rectangle;
  private thumb: Phaser.GameObjects.Rectangle;
  moved = 0;

  constructor(scene: Phaser.Scene, readonly rect: Phaser.Geom.Rectangle, contentHeight: number) {
    this.content = scene.add.container(rect.x, rect.y);
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff).fillRect(rect.x, rect.y, rect.width, rect.height);
    this.content.setMask(g.createGeometryMask());
    this.track = scene.add.rectangle(rect.right + 6, rect.y + rect.height / 2, 4, rect.height, 0xffffff, 0.06).setDepth(900);
    this.thumb = scene.add.rectangle(rect.right + 6, rect.y + 30, 6, 60, BAR_COLOR, 0.55).setDepth(901);
    scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (!this.contains(p)) return;
      this.start = { y: p.y, off: this.offset };
      this.last = { y: p.y, t: scene.time.now };
      this.vel = 0;
      this.moved = 0;
    });
    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.start || !p.isDown) return;
      const dy = p.y - this.start.y;
      this.moved = Math.max(this.moved, Math.abs(dy));
      if (this.moved < 8) return;
      const dt = Math.max(1, scene.time.now - this.last.t);
      const next = this.start.off - dy;
      this.vel = ((next - this.offset) * 1000) / dt;
      this.last = { y: p.y, t: scene.time.now };
      this.setOffset(next);
    });
    const end = (): void => {
      this.start = null;
    };
    scene.input.on('pointerup', end);
    scene.input.on('pointerupoutside', end);
    scene.input.on('wheel', (p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
      if (this.contains(p)) this.setOffset(this.offset + dy);
    });
    scene.events.on('update', (_t: number, dt: number) => this.update(dt));
    scene.events.once('shutdown', () => scene.events.off('update'));
    this.setContentHeight(contentHeight);
  }

  contains(p: Phaser.Input.Pointer): boolean {
    return Phaser.Geom.Rectangle.Contains(this.rect, p.x, p.y);
  }

  setContentHeight(h: number): void {
    this.maxOffset = Math.max(0, h - this.rect.height);
    this.setOffset(this.offset);
  }

  setOffset(o: number): void {
    this.offset = Phaser.Math.Clamp(o, 0, this.maxOffset);
    this.content.y = this.rect.y - this.offset;
    const show = this.maxOffset > 0;
    this.track.setVisible(show);
    this.thumb.setVisible(show);
    if (show) {
      const th = Math.max(50, (this.rect.height * this.rect.height) / (this.maxOffset + this.rect.height));
      this.thumb.setSize(6, th);
      this.thumb.y = this.rect.y + th / 2 + (this.offset / this.maxOffset) * (this.rect.height - th);
    }
  }

  scrollToContentY(y: number): void {
    this.setOffset(y - this.rect.height / 2);
  }

  private update(dt: number): void {
    if (!this.start && Math.abs(this.vel) > 10) {
      this.setOffset(this.offset + (this.vel * dt) / 1000);
      this.vel *= Math.pow(0.004, dt / 1000);
    }
  }

  destroy(): void {
    this.content.destroy();
    this.track.destroy();
    this.thumb.destroy();
  }
}

// ---------------------------------------------------------------------------------- переходы между экранами

export interface ZoomFrom {
  x: number;
  y: number;
  w: number;
  h: number;
  angle?: number;
}

/**
 * «Окно» из кнопки: каменный фон меню виден через скруглённое окно, размер которого плавно меняется между
 * прямоугольником кнопки и всем экраном. По краю — тонкая золотая кайма, углы к концу выпрямляются.
 * t = 0 — окно равно кнопке, t = 1 — окно на весь экран.
 */
const windowReveal = (scene: Phaser.Scene, from: ZoomFrom): { set: (t: number) => void; destroy: () => void } => {
  const img = scene.add.image(GAME_W / 2, GAME_H / 2, 'bg_stone').setDepth(3000).setScrollFactor(0);
  const maskG = scene.make.graphics({ x: 0, y: 0 }, false).setScrollFactor(0);
  img.setMask(maskG.createGeometryMask());
  const edge = scene.add.graphics().setDepth(3001).setScrollFactor(0);
  const lerp = Phaser.Math.Linear;
  return {
    set: (t) => {
      const x = lerp(from.x, GAME_W / 2, t);
      const y = lerp(from.y, GAME_H / 2, t);
      const w = lerp(from.w, GAME_W, t);
      const h = lerp(from.h, GAME_H, t);
      const r = lerp(28, 0, t * t);
      maskG.clear().fillStyle(0xffffff, 1).fillRoundedRect(x - w / 2, y - h / 2, w, h, r);
      edge.clear().lineStyle(4, COLOR.gold, 0.8 * (1 - t)).strokeRoundedRect(x - w / 2, y - h / 2, w, h, r);
    },
    destroy: () => {
      img.clearMask(true);
      img.destroy();
      maskG.destroy();
      edge.destroy();
    },
  };
};

/**
 * Выход из меню: всё содержимое (кроме каменного фона) плавно гаснет, затем запускается следующая сцена.
 * Так возврат в хаб не «рубит» интерфейс на полуслове — дальше окно сжимается в кнопку (zoomIn с `to`).
 */
export const leaveMenu = (scene: Phaser.Scene, next: string, data?: object, ms = 170): void => {
  const targets = scene.children.list.filter((o) => (o as unknown as { depth: number }).depth > -100);
  scene.tweens.add({ targets, alpha: 0, duration: ms, ease: 'Sine.easeIn', onComplete: () => scene.scene.start(next, data) });
};

/** Открытие меню: окно вырастает из кнопки на весь экран, затем запускается целевая сцена (она проявляет содержимое). */
export const zoomOut = (scene: Phaser.Scene, from: ZoomFrom, next: string, data?: object): void => {
  const win = windowReveal(scene, from);
  const state = { t: 0 };
  win.set(0);
  scene.tweens.add({
    targets: state,
    t: 1,
    duration: TIMING.menuZoom,
    ease: 'Cubic.easeInOut',
    onUpdate: () => win.set(state.t),
    onComplete: () => scene.scene.start(next, { ...data, zoomIn: true }),
  });
};

/**
 * Появление сцены. Без `to` каменный фон просто растворяется, открывая содержимое (меню после открытия);
 * с `to` окно сжимается обратно в кнопку-источник (возврат в хаб).
 */
export const zoomIn = (scene: Phaser.Scene, to?: ZoomFrom): void => {
  if (!to) {
    const img = scene.add.image(GAME_W / 2, GAME_H / 2, 'bg_stone').setDepth(3000).setScrollFactor(0);
    scene.tweens.add({ targets: img, alpha: 0, duration: TIMING.menuZoom * 0.8, ease: 'Sine.easeOut', onComplete: () => img.destroy() });
    return;
  }
  const win = windowReveal(scene, to);
  const state = { t: 1 };
  win.set(1);
  scene.tweens.add({
    targets: state,
    t: 0,
    duration: TIMING.menuZoom,
    ease: 'Cubic.easeInOut',
    onUpdate: () => win.set(state.t),
    onComplete: () => win.destroy(),
  });
};

/**
 * Уход в другую сцену: экран затемняется и чуть «наезжает» (камера приближается) — ощущение движения вперёд.
 * Новая сцена в ответ вызывает dollyIn.
 */
export const fadeToScene = (scene: Phaser.Scene, next: string, data?: object, ms = 280): void => {
  const cam = scene.cameras.main;
  cam.fadeOut(ms, 9, 10, 16);
  cam.zoomTo(1.06, ms, 'Cubic.easeIn');
  cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => scene.scene.start(next, data));
};

/** Появление сцены после fadeToScene: камера отъезжает с лёгким увеличением, картинка проявляется. */
export const dollyIn = (scene: Phaser.Scene, ms = 380): void => {
  const cam = scene.cameras.main;
  cam.fadeIn(Math.round(ms * 0.75), 9, 10, 16);
  cam.setZoom(0.95);
  cam.zoomTo(1, ms, 'Cubic.easeOut');
};

/**
 * Каскадное появление элементов: каждый чуть позже предыдущего «всплывает» на место с проявлением.
 * dy — откуда едут (положительное — снизу), dx — сбоку.
 */
export const staggerIn = (
  scene: Phaser.Scene, targets: Phaser.GameObjects.GameObject[], o: { delay?: number; gap?: number; dy?: number; dx?: number; ms?: number } = {},
): void => {
  const { delay = 60, gap = 55, dy = 26, dx = 0, ms = 340 } = o;
  targets.forEach((g, i) => {
    const obj = g as unknown as Phaser.GameObjects.Components.Transform & Phaser.GameObjects.Components.Alpha;
    if (!obj || !('x' in obj)) return;
    const x = obj.x;
    const y = obj.y;
    obj.setAlpha(0);
    obj.x = x + dx;
    obj.y = y + dy;
    scene.tweens.add({ targets: obj, alpha: 1, x, y, duration: ms, delay: delay + i * gap, ease: 'Cubic.easeOut' });
  });
};

export const background = (scene: Phaser.Scene): Phaser.GameObjects.Image =>
  scene.add.image(GAME_W / 2, GAME_H / 2, 'bg_stone').setDepth(-100).setScrollFactor(0);
