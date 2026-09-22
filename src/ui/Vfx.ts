import Phaser from 'phaser';
import type { VfxStyle } from '../data/perks';

export interface Pt {
  x: number;
  y: number;
}

/** Палитра эффектов: у каждой семьи способностей свой цвет, чтобы вспышку узнавали без подписи. */
const TINT: Record<VfxStyle, number> = {
  bolt: 0x9ad8ff,
  chain: 0x7fc4ff,
  arcane: 0xb287ff,
  beam: 0xfff0b0,
  fire: 0xff8a2a,
  explosion: 0xffb44a,
  holy: 0xfff3c4,
  banner: 0xf0c75e,
  dark: 0xb287ff,
  soul: 0xa98bff,
  mark: 0xff6a8a,
  quake: 0xd2a15a,
  slam: 0xffe0a0,
  blades: 0xeaf2ff,
  shot: 0xd8f0a0,
  arrows: 0xd8f0a0,
  smoke: 0x9aa0b4,
  swap: 0x7fe8d0,
  rewind: 0xb79dff,
};

/** Сколько ждать, прежде чем показывать следующее событие боя. */
const HOLD: Partial<Record<VfxStyle, number>> = {
  bolt: 210, chain: 260, arcane: 240, beam: 320,
  fire: 240, explosion: 300, holy: 340, banner: 420,
  dark: 260, soul: 240, mark: 260,
  quake: 320, slam: 200, blades: 220,
  shot: 200, arrows: 300, smoke: 240, swap: 260, rewind: 420,
};

const DEPTH = 80;

/**
 * Визуальные эффекты способностей. Каждая семья рисуется своими примитивами: молнии —
 * ломаной линией, огонь — языками пламени, свет — столбом сверху. Ничего не летит
 * «звёздочкой»: снаряды у каждой линейки свои.
 */
export class Vfx {
  constructor(private scene: Phaser.Scene) {}

  private get s(): Phaser.Scene {
    return this.scene;
  }

  /** Возвращает, сколько миллисекунд стоит подождать после эффекта. */
  play(style: VfxStyle, cells: Pt[], from: Pt): number {
    switch (style) {
      case 'bolt': cells.forEach((c) => this.lightning(from, c, TINT.bolt, 3)); break;
      case 'chain': this.chain(from, cells); break;
      case 'arcane': cells.forEach((c) => this.arcane(c)); break;
      case 'beam': cells.forEach((c) => this.pillar(c, TINT.beam, 74)); break;
      case 'fire': cells.forEach((c) => this.flames(c)); break;
      case 'explosion': cells.forEach((c) => this.explosion(c)); break;
      case 'holy': cells.forEach((c) => this.holy(c)); break;
      case 'banner': this.banner(cells); break;
      case 'dark': cells.forEach((c) => this.dark(c)); break;
      case 'soul': cells.forEach((c) => this.souls(c)); break;
      case 'mark': cells.forEach((c) => this.mark(c)); break;
      case 'quake': this.quake(cells); break;
      case 'slam': cells.forEach((c) => this.slam(c)); break;
      case 'blades': cells.forEach((c) => this.blades(c)); break;
      case 'shot': cells.forEach((c) => this.arrow(from, c)); break;
      case 'arrows': cells.forEach((c, i) => this.fallingArrow(c, i * 60)); break;
      case 'smoke': cells.forEach((c) => this.smoke(c)); break;
      case 'swap': this.swap(cells); break;
      case 'rewind': this.rewind(cells[0] ?? from); break;
    }
    return HOLD[style] ?? 220;
  }

  // ------------------------------------------------------------------ примитивы

  private glow(p: Pt, color: number, size: number, ms = 320): void {
    const g = this.s.add.image(p.x, p.y, 'glow').setTint(color).setDisplaySize(size, size)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH).setAlpha(0.9);
    this.s.tweens.add({ targets: g, alpha: 0, scale: 1.4, duration: ms, onComplete: () => g.destroy() });
  }

  private ring(p: Pt, color: number, to: number, ms = 400, width = 6): void {
    const r = this.s.add.image(p.x, p.y, 'ring').setTint(color).setDisplaySize(20, 20)
      .setDepth(DEPTH).setAlpha(0.95).setBlendMode(Phaser.BlendModes.ADD);
    void width;
    this.s.tweens.add({ targets: r, displayWidth: to, displayHeight: to, alpha: 0, duration: ms, ease: 'Cubic.easeOut', onComplete: () => r.destroy() });
  }

  /** Мелкие искры без формы — не «сюрикены», а точки света. */
  private sparks(p: Pt, color: number, n: number, spread = 70): void {
    for (let i = 0; i < n; i++) {
      const s = this.s.add.image(p.x, p.y, 'dot').setTint(color).setDepth(DEPTH)
        .setDisplaySize(10, 10).setBlendMode(Phaser.BlendModes.ADD);
      const a = Math.random() * Math.PI * 2;
      const d = spread * (0.4 + Math.random() * 0.8);
      this.s.tweens.add({
        targets: s, x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d,
        alpha: 0, scale: 0.3, duration: 320 + Math.random() * 260, onComplete: () => s.destroy(),
      });
    }
  }

  /** Отрезок линии произвольной толщины и угла. */
  private seg(a: Pt, b: Pt, color: number, w: number, alpha = 1): Phaser.GameObjects.Image {
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const img = this.s.add.image(a.x, a.y, 'px').setOrigin(0, 0.5).setTint(color)
      .setDisplaySize(len, w).setDepth(DEPTH).setAlpha(alpha).setBlendMode(Phaser.BlendModes.ADD);
    img.setRotation(Math.atan2(b.y - a.y, b.x - a.x));
    return img;
  }

  // ------------------------------------------------------------------ эффекты

  /** Ломаная молния: несколько отрезков со случайным изломом и яркой вспышкой в конце. */
  private lightning(from: Pt, to: Pt, color: number, steps: number): void {
    const parts: Phaser.GameObjects.Image[] = [];
    let prev = from;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const jitter = i === steps ? 0 : 26;
      const next = {
        x: from.x + (to.x - from.x) * t + (Math.random() - 0.5) * jitter * 2,
        y: from.y + (to.y - from.y) * t + (Math.random() - 0.5) * jitter * 2,
      };
      parts.push(this.seg(prev, next, 0xffffff, 7));
      parts.push(this.seg(prev, next, color, 14, 0.55));
      prev = next;
    }
    this.s.tweens.add({ targets: parts, alpha: 0, duration: 200, delay: 60, onComplete: () => parts.forEach((p) => p.destroy()) });
    this.glow(to, color, 150, 260);
    this.sparks(to, color, 8, 50);
  }

  /** Цепь разрядов: герой → первая цель → следующая. */
  private chain(from: Pt, cells: Pt[]): void {
    let prev = from;
    cells.forEach((c, i) => {
      this.s.time.delayedCall(i * 70, () => {
        this.lightning(prev, c, TINT.chain, 2);
        prev = c;
      });
    });
  }

  /** Арканный удар: кольцо схлопывается в точку и вспыхивает. */
  private arcane(p: Pt): void {
    const r = this.s.add.image(p.x, p.y, 'ring').setTint(TINT.arcane).setDisplaySize(160, 160)
      .setDepth(DEPTH).setBlendMode(Phaser.BlendModes.ADD);
    this.s.tweens.add({
      targets: r, displayWidth: 20, displayHeight: 20, angle: 180, alpha: 0.2, duration: 200, ease: 'Cubic.easeIn',
      onComplete: () => {
        r.destroy();
        this.glow(p, TINT.arcane, 170, 280);
        this.sparks(p, TINT.arcane, 10, 60);
      },
    });
  }

  /** Столб света сверху вниз через клетку. */
  private pillar(p: Pt, color: number, w: number): void {
    const beam = this.s.add.image(p.x, p.y, 'px').setTint(color).setDisplaySize(w, 0)
      .setDepth(DEPTH).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.9);
    const core = this.s.add.image(p.x, p.y, 'px').setTint(0xffffff).setDisplaySize(w * 0.3, 0)
      .setDepth(DEPTH + 1).setBlendMode(Phaser.BlendModes.ADD);
    this.s.tweens.add({ targets: [beam, core], displayHeight: 1400, duration: 160, ease: 'Quad.easeOut' });
    this.s.tweens.add({ targets: [beam, core], alpha: 0, delay: 150, duration: 220, onComplete: () => { beam.destroy(); core.destroy(); } });
    this.ring(p, color, 190, 420);
  }

  /** Языки пламени поднимаются от карточки. */
  private flames(p: Pt): void {
    for (let i = 0; i < 7; i++) {
      const x = p.x + (Math.random() - 0.5) * 90;
      const f = this.s.add.image(x, p.y + 40, 'flame').setTint(i % 2 ? 0xffd15a : TINT.fire)
        .setDisplaySize(26, 40).setDepth(DEPTH).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.95);
      this.s.tweens.add({
        targets: f, y: p.y - 60 - Math.random() * 40, displayWidth: 10, displayHeight: 16, alpha: 0,
        delay: i * 26, duration: 380 + Math.random() * 180, onComplete: () => f.destroy(),
      });
    }
    this.glow(p, TINT.fire, 150, 320);
  }

  /** Взрыв: ударная волна и разлетающиеся угли. */
  private explosion(p: Pt): void {
    this.ring(p, TINT.explosion, 240, 360);
    this.glow(p, 0xffffff, 190, 220);
    this.sparks(p, TINT.explosion, 14, 110);
    this.s.cameras.main.shake(180, 0.006);
  }

  /** Столб света и расходящийся нимб. */
  private holy(p: Pt): void {
    this.pillar(p, TINT.holy, 96);
    this.ring(p, 0xffffff, 150, 300);
  }

  /** Знамя разворачивается над полем. */
  private banner(cells: Pt[]): void {
    const cx = cells.length ? cells.reduce((a, c) => a + c.x, 0) / cells.length : 360;
    const top = this.s.add.image(cx, 200, 'px').setTint(TINT.banner).setDisplaySize(240, 0)
      .setDepth(DEPTH).setAlpha(0.8).setOrigin(0.5, 0);
    this.s.tweens.add({ targets: top, displayHeight: 420, duration: 220, ease: 'Back.easeOut' });
    this.s.tweens.add({ targets: top, alpha: 0, delay: 220, duration: 260, onComplete: () => top.destroy() });
    cells.forEach((c) => this.sparks(c, TINT.banner, 6, 50));
  }

  /** Тёмные щупальца и фиолетовая вспышка. */
  private dark(p: Pt): void {
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6 + Math.random() * 0.4;
      const end = { x: p.x + Math.cos(a) * 70, y: p.y + Math.sin(a) * 70 };
      const seg = this.seg(p, end, TINT.dark, 10, 0.85);
      this.s.tweens.add({ targets: seg, alpha: 0, duration: 300, delay: 40, onComplete: () => seg.destroy() });
    }
    this.glow(p, 0x5a2a8a, 180, 340);
  }

  /** Души-огоньки поднимаются вверх. */
  private souls(p: Pt): void {
    for (let i = 0; i < 5; i++) {
      const w = this.s.add.image(p.x + (Math.random() - 0.5) * 70, p.y, 'dot').setTint(TINT.soul)
        .setDisplaySize(14, 14).setDepth(DEPTH).setBlendMode(Phaser.BlendModes.ADD);
      this.s.tweens.add({
        targets: w, y: p.y - 110 - Math.random() * 50, x: w.x + (Math.random() - 0.5) * 40,
        alpha: 0, scale: 0.4, delay: i * 40, duration: 500, onComplete: () => w.destroy(),
      });
    }
  }

  /** Клеймо: печать вдавливается в карточку. */
  private mark(p: Pt): void {
    const r = this.s.add.image(p.x, p.y, 'ring').setTint(TINT.mark).setDisplaySize(190, 190)
      .setDepth(DEPTH).setAlpha(0);
    this.s.tweens.add({
      targets: r, displayWidth: 90, displayHeight: 90, alpha: { from: 1, to: 0 }, angle: -90,
      duration: 300, ease: 'Cubic.easeIn', onComplete: () => r.destroy(),
    });
    this.glow(p, TINT.mark, 130, 300);
  }

  /** Трещины по земле и пыль. */
  private quake(cells: Pt[]): void {
    for (const p of cells) {
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2;
        const end = { x: p.x + Math.cos(a) * 80, y: p.y + Math.sin(a) * 30 };
        const seg = this.seg({ x: p.x, y: p.y + 30 }, end, TINT.quake, 6, 0.9);
        this.s.tweens.add({ targets: seg, alpha: 0, duration: 420, delay: 80, onComplete: () => seg.destroy() });
      }
      this.sparks({ x: p.x, y: p.y + 30 }, TINT.quake, 7, 60);
    }
    this.s.cameras.main.shake(260, 0.008);
  }

  /** Удар: короткая вспышка-звезда из четырёх лучей. */
  private slam(p: Pt): void {
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI / 2) * i + Math.PI / 4;
      const seg = this.seg(
        { x: p.x - Math.cos(a) * 60, y: p.y - Math.sin(a) * 60 },
        { x: p.x + Math.cos(a) * 60, y: p.y + Math.sin(a) * 60 },
        TINT.slam, 8, 0.95,
      );
      this.s.tweens.add({ targets: seg, alpha: 0, duration: 220, onComplete: () => seg.destroy() });
    }
    this.glow(p, TINT.slam, 140, 240);
    this.s.cameras.main.shake(120, 0.005);
  }

  /** Скрещённые росчерки клинка. */
  private blades(p: Pt): void {
    [-35, 35].forEach((deg, i) => {
      const a = Phaser.Math.DegToRad(deg);
      const seg = this.seg(
        { x: p.x - Math.cos(a) * 95, y: p.y - Math.sin(a) * 95 },
        { x: p.x + Math.cos(a) * 95, y: p.y + Math.sin(a) * 95 },
        TINT.blades, 6, 0,
      );
      this.s.tweens.add({ targets: seg, alpha: { from: 1, to: 0 }, delay: i * 70, duration: 230, onComplete: () => seg.destroy() });
    });
    this.sparks(p, TINT.blades, 6, 60);
  }

  /** Стрела летит от героя к цели. */
  private arrow(from: Pt, to: Pt): void {
    const ang = Math.atan2(to.y - from.y, to.x - from.x);
    const shaft = this.s.add.image(from.x, from.y, 'arrow_vfx').setDepth(DEPTH)
      .setDisplaySize(70, 16).setRotation(ang);
    this.s.tweens.add({
      targets: shaft, x: to.x, y: to.y, duration: 170, ease: 'Quad.easeIn',
      onComplete: () => {
        shaft.destroy();
        this.sparks(to, TINT.shot, 7, 50);
      },
    });
  }

  /** Стрела падает с неба. */
  private fallingArrow(to: Pt, delay: number): void {
    const a = this.s.add.image(to.x, to.y - 320, 'arrow_vfx').setDepth(DEPTH)
      .setDisplaySize(64, 14).setRotation(Math.PI / 2);
    this.s.tweens.add({
      targets: a, y: to.y, duration: 190, delay, ease: 'Quad.easeIn',
      onComplete: () => {
        a.destroy();
        this.sparks(to, TINT.arrows, 6, 46);
      },
    });
  }

  /** Тёмный дымок — появление и исчезновение. */
  smoke(p: Pt): void {
    const puff = this.s.add.circle(p.x, p.y, 26, 0x1b1230, 0.85).setDepth(DEPTH - 2);
    this.s.tweens.add({ targets: puff, scale: 2.8, alpha: 0, duration: 330, ease: 'Cubic.easeOut', onComplete: () => puff.destroy() });
    this.sparks(p, TINT.smoke, 8, 60);
  }

  /** Обмен местами: два кольца закручиваются навстречу. */
  private swap(cells: Pt[]): void {
    for (const p of cells) {
      const r = this.s.add.image(p.x, p.y, 'ring').setTint(TINT.swap).setDisplaySize(40, 40)
        .setDepth(DEPTH).setBlendMode(Phaser.BlendModes.ADD);
      this.s.tweens.add({ targets: r, displayWidth: 180, displayHeight: 180, angle: 200, alpha: 0, duration: 340, onComplete: () => r.destroy() });
    }
  }

  /** Откат времени: кольцо крутится назад, экран мигает. */
  private rewind(p: Pt): void {
    for (let i = 0; i < 3; i++) {
      const r = this.s.add.image(p.x, p.y, 'ring').setTint(TINT.rewind).setDisplaySize(260, 260)
        .setDepth(DEPTH).setAlpha(0.9).setBlendMode(Phaser.BlendModes.ADD);
      this.s.tweens.add({
        targets: r, displayWidth: 40, displayHeight: 40, angle: -260, alpha: 0,
        delay: i * 80, duration: 380, ease: 'Cubic.easeIn', onComplete: () => r.destroy(),
      });
    }
    this.s.cameras.main.flash(260, 150, 120, 255);
  }
}
