import Phaser from 'phaser';

import type { VfxStyle } from '../../../../domain/catalog';
import type { Point } from '../../interfaces/Point';

/**
 * Визуальные эффекты способностей. Каждая семья рисуется своими примитивами: молнии —
 * ломаной линией, огонь — языками пламени, свет — столбом сверху. Ничего не летит
 * «звёздочкой»: снаряды у каждой линейки свои.
 */
export class Vfx {
  /** Палитра эффектов: у каждой семьи способностей свой цвет, чтобы вспышку узнавали без подписи. */
  private static readonly TINT: Record<VfxStyle, number> = {
    bolt: 0x9ad8ff,
    chain: 0x7fc4ff,
    arcane: 0xb287ff,
    beam: 0xfff0b0,
    fire: 0xff8a2a,
    explosion: 0xffb44a,
    ignite: 0xff6a1a,
    fireball: 0xffa03a,
    detonate: 0xff5a2a,
    inferno: 0xff7a18,
    holy: 0xfff3c4,
    banner: 0xf0c75e,
    dark: 0xb287ff,
    soul: 0xa98bff,
    mark: 0xff6a8a,
    corpse: 0x8fd14f,
    ghost: 0xa9e8ff,
    voodoo: 0xd05aff,
    harvest: 0x9a6bff,
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
  private static readonly HOLD: Partial<Record<VfxStyle, number>> = {
    bolt: 210,
    chain: 260,
    arcane: 240,
    beam: 320,
    fire: 240,
    explosion: 300,
    holy: 340,
    banner: 420,
    ignite: 260,
    fireball: 320,
    detonate: 380,
    inferno: 520,
    dark: 260,
    soul: 240,
    mark: 260,
    corpse: 340,
    ghost: 320,
    voodoo: 340,
    harvest: 460,
    quake: 320,
    slam: 200,
    blades: 220,
    shot: 200,
    arrows: 300,
    smoke: 240,
    swap: 260,
    rewind: 420,
  };

  private static readonly DEPTH = 80;

  constructor(private scene: Phaser.Scene) {}

  private get s(): Phaser.Scene {
    return this.scene;
  }

  /** Возвращает, сколько миллисекунд стоит подождать после эффекта. */
  play(style: VfxStyle, cells: Point[], from: Point): number {
    switch (style) {
      case 'bolt':
        cells.forEach((c) => this.lightning(from, c, Vfx.TINT.bolt, 3));
        break;
      case 'chain':
        this.chain(from, cells);
        break;
      case 'arcane':
        cells.forEach((c) => this.arcane(c));
        break;
      case 'beam':
        cells.forEach((c) => this.pillar(c, Vfx.TINT.beam, 74));
        break;
      case 'fire':
        cells.forEach((c) => this.flames(c));
        break;
      case 'explosion':
        cells.forEach((c) => this.explosion(c));
        break;
      case 'ignite':
        cells.forEach((c) => this.ignite(c));
        break;
      case 'fireball':
        cells.forEach((c) => this.fireball(from, c));
        break;
      case 'detonate':
        this.detonate(cells);
        break;
      case 'inferno':
        this.inferno(cells);
        break;
      case 'holy':
        cells.forEach((c) => this.holy(c));
        break;
      case 'banner':
        this.banner(cells);
        break;
      case 'dark':
        cells.forEach((c) => this.dark(c));
        break;
      case 'soul':
        cells.forEach((c) => this.souls(c));
        break;
      case 'mark':
        cells.forEach((c) => this.mark(c));
        break;
      case 'corpse':
        cells.forEach((c) => this.corpse(c));
        break;
      case 'ghost':
        this.ghost(from, cells);
        break;
      case 'voodoo':
        cells.forEach((c) => this.voodoo(from, c));
        break;
      case 'harvest':
        this.harvest(from, cells);
        break;
      case 'quake':
        this.quake(cells);
        break;
      case 'slam':
        cells.forEach((c) => this.slam(c));
        break;
      case 'blades':
        cells.forEach((c) => this.blades(c));
        break;
      case 'shot':
        cells.forEach((c) => this.arrow(from, c));
        break;
      case 'arrows':
        cells.forEach((c, i) => this.fallingArrow(c, i * 60));
        break;
      case 'smoke':
        cells.forEach((c) => this.smoke(c));
        break;
      case 'swap':
        this.swap(cells);
        break;
      case 'rewind':
        this.rewind(cells[0] ?? from);
        break;
    }
    return Vfx.HOLD[style] ?? 220;
  }

  // ------------------------------------------------------------------ примитивы

  private glow(p: Point, color: number, size: number, ms = 320): void {
    const g = this.s.add
      .image(p.x, p.y, 'glow')
      .setTint(color)
      .setDisplaySize(size, size)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(Vfx.DEPTH)
      .setAlpha(0.9);
    this.s.tweens.add({
      targets: g,
      alpha: 0,
      scale: 1.4,
      duration: ms,
      onComplete: () => g.destroy(),
    });
  }

  private ring(p: Point, color: number, to: number, ms = 400, width = 6): void {
    const r = this.s.add
      .image(p.x, p.y, 'ring')
      .setTint(color)
      .setDisplaySize(20, 20)
      .setDepth(Vfx.DEPTH)
      .setAlpha(0.95)
      .setBlendMode(Phaser.BlendModes.ADD);
    void width;
    this.s.tweens.add({
      targets: r,
      displayWidth: to,
      displayHeight: to,
      alpha: 0,
      duration: ms,
      ease: 'Cubic.easeOut',
      onComplete: () => r.destroy(),
    });
  }

  /** Мелкие искры без формы — не «сюрикены», а точки света. */
  private sparks(p: Point, color: number, n: number, spread = 70): void {
    for (let i = 0; i < n; i++) {
      const s = this.s.add
        .image(p.x, p.y, 'dot')
        .setTint(color)
        .setDepth(Vfx.DEPTH)
        .setDisplaySize(10, 10)
        .setBlendMode(Phaser.BlendModes.ADD);
      const a = Math.random() * Math.PI * 2;
      const d = spread * (0.4 + Math.random() * 0.8);
      this.s.tweens.add({
        targets: s,
        x: p.x + Math.cos(a) * d,
        y: p.y + Math.sin(a) * d,
        alpha: 0,
        scale: 0.3,
        duration: 320 + Math.random() * 260,
        onComplete: () => s.destroy(),
      });
    }
  }

  /** Отрезок линии произвольной толщины и угла. */
  private seg(a: Point, b: Point, color: number, w: number, alpha = 1): Phaser.GameObjects.Image {
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const img = this.s.add
      .image(a.x, a.y, 'px')
      .setOrigin(0, 0.5)
      .setTint(color)
      .setDisplaySize(len, w)
      .setDepth(Vfx.DEPTH)
      .setAlpha(alpha)
      .setBlendMode(Phaser.BlendModes.ADD);
    img.setRotation(Math.atan2(b.y - a.y, b.x - a.x));
    return img;
  }

  // ------------------------------------------------------------------ эффекты

  /** Ломаная молния: несколько отрезков со случайным изломом и яркой вспышкой в конце. */
  private lightning(from: Point, to: Point, color: number, steps: number): void {
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
    this.s.tweens.add({
      targets: parts,
      alpha: 0,
      duration: 200,
      delay: 60,
      onComplete: () => parts.forEach((p) => p.destroy()),
    });
    this.glow(to, color, 150, 260);
    this.sparks(to, color, 8, 50);
  }

  /** Цепь разрядов: герой → первая цель → следующая. */
  private chain(from: Point, cells: Point[]): void {
    let prev = from;
    cells.forEach((c, i) => {
      this.s.time.delayedCall(i * 70, () => {
        this.lightning(prev, c, Vfx.TINT.chain, 2);
        prev = c;
      });
    });
  }

  /** Арканный удар: кольцо схлопывается в точку и вспыхивает. */
  private arcane(p: Point): void {
    const r = this.s.add
      .image(p.x, p.y, 'ring')
      .setTint(Vfx.TINT.arcane)
      .setDisplaySize(160, 160)
      .setDepth(Vfx.DEPTH)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.s.tweens.add({
      targets: r,
      displayWidth: 20,
      displayHeight: 20,
      angle: 180,
      alpha: 0.2,
      duration: 200,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        r.destroy();
        this.glow(p, Vfx.TINT.arcane, 170, 280);
        this.sparks(p, Vfx.TINT.arcane, 10, 60);
      },
    });
  }

  /** Столб света сверху вниз через клетку. */
  private pillar(p: Point, color: number, w: number): void {
    const beam = this.s.add
      .image(p.x, p.y, 'px')
      .setTint(color)
      .setDisplaySize(w, 0)
      .setDepth(Vfx.DEPTH)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.9);
    const core = this.s.add
      .image(p.x, p.y, 'px')
      .setTint(0xffffff)
      .setDisplaySize(w * 0.3, 0)
      .setDepth(Vfx.DEPTH + 1)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.s.tweens.add({
      targets: [beam, core],
      displayHeight: 1400,
      duration: 160,
      ease: 'Quad.easeOut',
    });
    this.s.tweens.add({
      targets: [beam, core],
      alpha: 0,
      delay: 150,
      duration: 220,
      onComplete: () => {
        beam.destroy();
        core.destroy();
      },
    });
    this.ring(p, color, 190, 420);
  }

  /** Тлеющее клеймо поджога: печать из угольков и тонкий дымок вверх. */
  private ignite(p: Point): void {
    const r = this.s.add
      .image(p.x, p.y, 'ring')
      .setTint(Vfx.TINT.ignite)
      .setDisplaySize(30, 30)
      .setDepth(Vfx.DEPTH)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.s.tweens.add({
      targets: r,
      displayWidth: 130,
      displayHeight: 130,
      alpha: 0,
      duration: 300,
      ease: 'Cubic.easeOut',
      onComplete: () => r.destroy(),
    });
    for (let i = 0; i < 5; i++) {
      const x = p.x + (Math.random() - 0.5) * 60;
      const e = this.s.add
        .image(x, p.y + 20, 'dot')
        .setTint(i % 2 ? 0xffd15a : Vfx.TINT.ignite)
        .setDisplaySize(9, 9)
        .setDepth(Vfx.DEPTH)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.s.tweens.add({
        targets: e,
        y: p.y - 60 - Math.random() * 40,
        x: x + (Math.random() - 0.5) * 30,
        alpha: 0,
        scale: 0.3,
        delay: i * 40,
        duration: 460,
        onComplete: () => e.destroy(),
      });
    }
    this.glow(p, Vfx.TINT.ignite, 110, 280);
  }

  /** Огненный шар: летит от героя, тянет хвост искр и лопается на цели. */
  private fireball(from: Point, to: Point): void {
    const ball = this.s.add
      .image(from.x, from.y, 'glow')
      .setTint(Vfx.TINT.fireball)
      .setDisplaySize(52, 52)
      .setDepth(Vfx.DEPTH)
      .setBlendMode(Phaser.BlendModes.ADD);
    const core = this.s.add
      .image(from.x, from.y, 'dot')
      .setTint(0xfff1c0)
      .setDisplaySize(22, 22)
      .setDepth(Vfx.DEPTH + 1)
      .setBlendMode(Phaser.BlendModes.ADD);
    const trail = this.s.time.addEvent({
      delay: 22,
      repeat: 9,
      callback: () => {
        const t = this.s.add
          .image(core.x, core.y, 'dot')
          .setTint(Vfx.TINT.fire)
          .setDisplaySize(16, 16)
          .setDepth(Vfx.DEPTH - 1)
          .setBlendMode(Phaser.BlendModes.ADD);
        this.s.tweens.add({
          targets: t,
          alpha: 0,
          scale: 0.2,
          duration: 260,
          onComplete: () => t.destroy(),
        });
      },
    });
    this.s.tweens.add({
      targets: [ball, core],
      x: to.x,
      y: to.y,
      duration: 230,
      ease: 'Quad.easeIn',
      onComplete: () => {
        trail.remove();
        ball.destroy();
        core.destroy();
        this.explosion(to);
        this.flames(to);
      },
    });
  }

  /** Детонация: горящие цели рвутся одна за другой, волна идёт по полю. */
  private detonate(cells: Point[]): void {
    cells.forEach((c, i) => {
      this.s.time.delayedCall(i * 70, () => {
        this.explosion(c);
        this.sparks(c, Vfx.TINT.detonate, 10, 120);
      });
    });
    this.s.cameras.main.shake(300, 0.01);
  }

  /** Инферно: огненная буря по всему полю — столбы пламени и зарево. */
  private inferno(cells: Point[]): void {
    const sheet = this.s.add
      .image(360, 640, 'px')
      .setTint(Vfx.TINT.inferno)
      .setDisplaySize(720, 1280)
      .setDepth(Vfx.DEPTH - 3)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.s.tweens.add({
      targets: sheet,
      alpha: 0.32,
      duration: 160,
      yoyo: true,
      hold: 120,
      onComplete: () => sheet.destroy(),
    });
    cells.forEach((c, i) => {
      this.s.time.delayedCall(i * 55, () => {
        this.pillar(c, Vfx.TINT.inferno, 86);
        this.flames(c);
        this.sparks(c, 0xffd15a, 10, 90);
      });
    });
    this.s.cameras.main.shake(420, 0.009);
  }

  /** Взрыв плоти: зелёная вспышка гнили и брызги во все стороны. */
  private corpse(p: Point): void {
    this.ring(p, Vfx.TINT.corpse, 230, 360);
    this.glow(p, Vfx.TINT.corpse, 170, 300);
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI * 2 * i) / 10 + Math.random() * 0.3;
      const seg = this.seg(
        p,
        { x: p.x + Math.cos(a) * 80, y: p.y + Math.sin(a) * 80 },
        Vfx.TINT.corpse,
        7,
        0.8,
      );
      this.s.tweens.add({ targets: seg, alpha: 0, duration: 280, onComplete: () => seg.destroy() });
    }
    this.sparks(p, 0xd7ff8a, 12, 100);
  }

  /** Призрачные слуги: полупрозрачные огоньки срываются от героя к целям. */
  private ghost(from: Point, cells: Point[]): void {
    cells.forEach((c, i) => {
      const g = this.s.add
        .image(from.x, from.y, 'glow')
        .setTint(Vfx.TINT.ghost)
        .setDisplaySize(44, 44)
        .setDepth(Vfx.DEPTH)
        .setAlpha(0.85)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.s.tweens.add({
        targets: g,
        x: c.x,
        y: c.y,
        delay: i * 90,
        duration: 240,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          g.destroy();
          this.sparks(c, Vfx.TINT.ghost, 6, 40);
        },
      });
    });
  }

  /** Кукла вуду: нить от героя к цели и пульсирующая печать. */
  private voodoo(from: Point, to: Point): void {
    const parts: Phaser.GameObjects.Image[] = [];
    // нить идёт не прямо, а провисает — рисуем тремя звеньями
    const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 + 40 };
    parts.push(this.seg(from, mid, Vfx.TINT.voodoo, 5, 0.9));
    parts.push(this.seg(mid, to, Vfx.TINT.voodoo, 5, 0.9));
    this.s.tweens.add({
      targets: parts,
      alpha: 0,
      duration: 340,
      delay: 120,
      onComplete: () => parts.forEach((x) => x.destroy()),
    });
    const r = this.s.add
      .image(to.x, to.y, 'ring')
      .setTint(Vfx.TINT.voodoo)
      .setDisplaySize(150, 150)
      .setDepth(Vfx.DEPTH)
      .setAlpha(0);
    this.s.tweens.add({
      targets: r,
      displayWidth: 84,
      displayHeight: 84,
      alpha: { from: 1, to: 0 },
      angle: 120,
      duration: 340,
      ease: 'Cubic.easeIn',
      onComplete: () => r.destroy(),
    });
    this.glow(to, Vfx.TINT.voodoo, 130, 320);
  }

  /** Жатва душ: от каждого врага к герою тянется огонёк, герой вспыхивает. */
  private harvest(to: Point, cells: Point[]): void {
    cells.forEach((c, i) => {
      const w = this.s.add
        .image(c.x, c.y, 'dot')
        .setTint(Vfx.TINT.harvest)
        .setDisplaySize(18, 18)
        .setDepth(Vfx.DEPTH)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.s.tweens.add({
        targets: w,
        x: to.x,
        y: to.y,
        delay: i * 55,
        duration: 320,
        ease: 'Quad.easeIn',
        onComplete: () => {
          w.destroy();
          this.glow(to, Vfx.TINT.harvest, 120, 220);
        },
      });
      this.souls(c);
    });
    this.s.time.delayedCall(cells.length * 55 + 320, () =>
      this.ring(to, Vfx.TINT.harvest, 260, 420),
    );
  }

  /** Языки пламени поднимаются от карточки. */
  private flames(p: Point): void {
    for (let i = 0; i < 7; i++) {
      const x = p.x + (Math.random() - 0.5) * 90;
      const f = this.s.add
        .image(x, p.y + 40, 'flame')
        .setTint(i % 2 ? 0xffd15a : Vfx.TINT.fire)
        .setDisplaySize(26, 40)
        .setDepth(Vfx.DEPTH)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0.95);
      this.s.tweens.add({
        targets: f,
        y: p.y - 60 - Math.random() * 40,
        displayWidth: 10,
        displayHeight: 16,
        alpha: 0,
        delay: i * 26,
        duration: 380 + Math.random() * 180,
        onComplete: () => f.destroy(),
      });
    }
    this.glow(p, Vfx.TINT.fire, 150, 320);
  }

  /** Взрыв: ударная волна и разлетающиеся угли. */
  private explosion(p: Point): void {
    this.ring(p, Vfx.TINT.explosion, 240, 360);
    this.glow(p, 0xffffff, 190, 220);
    this.sparks(p, Vfx.TINT.explosion, 14, 110);
    this.s.cameras.main.shake(180, 0.006);
  }

  /** Столб света и расходящийся нимб. */
  private holy(p: Point): void {
    this.pillar(p, Vfx.TINT.holy, 96);
    this.ring(p, 0xffffff, 150, 300);
  }

  /** Знамя разворачивается над полем. */
  private banner(cells: Point[]): void {
    const cx = cells.length ? cells.reduce((a, c) => a + c.x, 0) / cells.length : 360;
    const top = this.s.add
      .image(cx, 200, 'px')
      .setTint(Vfx.TINT.banner)
      .setDisplaySize(240, 0)
      .setDepth(Vfx.DEPTH)
      .setAlpha(0.8)
      .setOrigin(0.5, 0);
    this.s.tweens.add({ targets: top, displayHeight: 420, duration: 220, ease: 'Back.easeOut' });
    this.s.tweens.add({
      targets: top,
      alpha: 0,
      delay: 220,
      duration: 260,
      onComplete: () => top.destroy(),
    });
    cells.forEach((c) => this.sparks(c, Vfx.TINT.banner, 6, 50));
  }

  /** Тёмные щупальца и фиолетовая вспышка. */
  private dark(p: Point): void {
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6 + Math.random() * 0.4;
      const end = { x: p.x + Math.cos(a) * 70, y: p.y + Math.sin(a) * 70 };
      const seg = this.seg(p, end, Vfx.TINT.dark, 10, 0.85);
      this.s.tweens.add({
        targets: seg,
        alpha: 0,
        duration: 300,
        delay: 40,
        onComplete: () => seg.destroy(),
      });
    }
    this.glow(p, 0x5a2a8a, 180, 340);
  }

  /** Души-огоньки поднимаются вверх. */
  private souls(p: Point): void {
    for (let i = 0; i < 5; i++) {
      const w = this.s.add
        .image(p.x + (Math.random() - 0.5) * 70, p.y, 'dot')
        .setTint(Vfx.TINT.soul)
        .setDisplaySize(14, 14)
        .setDepth(Vfx.DEPTH)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.s.tweens.add({
        targets: w,
        y: p.y - 110 - Math.random() * 50,
        x: w.x + (Math.random() - 0.5) * 40,
        alpha: 0,
        scale: 0.4,
        delay: i * 40,
        duration: 500,
        onComplete: () => w.destroy(),
      });
    }
  }

  /** Клеймо: печать вдавливается в карточку. */
  private mark(p: Point): void {
    const r = this.s.add
      .image(p.x, p.y, 'ring')
      .setTint(Vfx.TINT.mark)
      .setDisplaySize(190, 190)
      .setDepth(Vfx.DEPTH)
      .setAlpha(0);
    this.s.tweens.add({
      targets: r,
      displayWidth: 90,
      displayHeight: 90,
      alpha: { from: 1, to: 0 },
      angle: -90,
      duration: 300,
      ease: 'Cubic.easeIn',
      onComplete: () => r.destroy(),
    });
    this.glow(p, Vfx.TINT.mark, 130, 300);
  }

  /** Трещины по земле и пыль. */
  private quake(cells: Point[]): void {
    for (const p of cells) {
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2;
        const end = { x: p.x + Math.cos(a) * 80, y: p.y + Math.sin(a) * 30 };
        const seg = this.seg({ x: p.x, y: p.y + 30 }, end, Vfx.TINT.quake, 6, 0.9);
        this.s.tweens.add({
          targets: seg,
          alpha: 0,
          duration: 420,
          delay: 80,
          onComplete: () => seg.destroy(),
        });
      }
      this.sparks({ x: p.x, y: p.y + 30 }, Vfx.TINT.quake, 7, 60);
    }
    this.s.cameras.main.shake(260, 0.008);
  }

  /** Удар: короткая вспышка-звезда из четырёх лучей. */
  private slam(p: Point): void {
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI / 2) * i + Math.PI / 4;
      const seg = this.seg(
        { x: p.x - Math.cos(a) * 60, y: p.y - Math.sin(a) * 60 },
        { x: p.x + Math.cos(a) * 60, y: p.y + Math.sin(a) * 60 },
        Vfx.TINT.slam,
        8,
        0.95,
      );
      this.s.tweens.add({ targets: seg, alpha: 0, duration: 220, onComplete: () => seg.destroy() });
    }
    this.glow(p, Vfx.TINT.slam, 140, 240);
    this.s.cameras.main.shake(120, 0.005);
  }

  /** Скрещённые росчерки клинка. */
  private blades(p: Point): void {
    [-35, 35].forEach((deg, i) => {
      const a = Phaser.Math.DegToRad(deg);
      const seg = this.seg(
        { x: p.x - Math.cos(a) * 95, y: p.y - Math.sin(a) * 95 },
        { x: p.x + Math.cos(a) * 95, y: p.y + Math.sin(a) * 95 },
        Vfx.TINT.blades,
        6,
        0,
      );
      this.s.tweens.add({
        targets: seg,
        alpha: { from: 1, to: 0 },
        delay: i * 70,
        duration: 230,
        onComplete: () => seg.destroy(),
      });
    });
    this.sparks(p, Vfx.TINT.blades, 6, 60);
  }

  /** Стрела летит от героя к цели. */
  private arrow(from: Point, to: Point): void {
    const ang = Math.atan2(to.y - from.y, to.x - from.x);
    const shaft = this.s.add
      .image(from.x, from.y, 'arrow_vfx')
      .setDepth(Vfx.DEPTH)
      .setDisplaySize(70, 16)
      .setRotation(ang);
    this.s.tweens.add({
      targets: shaft,
      x: to.x,
      y: to.y,
      duration: 170,
      ease: 'Quad.easeIn',
      onComplete: () => {
        shaft.destroy();
        this.sparks(to, Vfx.TINT.shot, 7, 50);
      },
    });
  }

  /** Стрела падает с неба. */
  private fallingArrow(to: Point, delay: number): void {
    const a = this.s.add
      .image(to.x, to.y - 320, 'arrow_vfx')
      .setDepth(Vfx.DEPTH)
      .setDisplaySize(64, 14)
      .setRotation(Math.PI / 2);
    this.s.tweens.add({
      targets: a,
      y: to.y,
      duration: 190,
      delay,
      ease: 'Quad.easeIn',
      onComplete: () => {
        a.destroy();
        this.sparks(to, Vfx.TINT.arrows, 6, 46);
      },
    });
  }

  /** Тёмный дымок — появление и исчезновение. */
  smoke(p: Point): void {
    const puff = this.s.add.circle(p.x, p.y, 26, 0x1b1230, 0.85).setDepth(Vfx.DEPTH - 2);
    this.s.tweens.add({
      targets: puff,
      scale: 2.8,
      alpha: 0,
      duration: 330,
      ease: 'Cubic.easeOut',
      onComplete: () => puff.destroy(),
    });
    this.sparks(p, Vfx.TINT.smoke, 8, 60);
  }

  /** Обмен местами: два кольца закручиваются навстречу. */
  private swap(cells: Point[]): void {
    for (const p of cells) {
      const r = this.s.add
        .image(p.x, p.y, 'ring')
        .setTint(Vfx.TINT.swap)
        .setDisplaySize(40, 40)
        .setDepth(Vfx.DEPTH)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.s.tweens.add({
        targets: r,
        displayWidth: 180,
        displayHeight: 180,
        angle: 200,
        alpha: 0,
        duration: 340,
        onComplete: () => r.destroy(),
      });
    }
  }

  /** Откат времени: кольцо крутится назад, экран мигает. */
  private rewind(p: Point): void {
    for (let i = 0; i < 3; i++) {
      const r = this.s.add
        .image(p.x, p.y, 'ring')
        .setTint(Vfx.TINT.rewind)
        .setDisplaySize(260, 260)
        .setDepth(Vfx.DEPTH)
        .setAlpha(0.9)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.s.tweens.add({
        targets: r,
        displayWidth: 40,
        displayHeight: 40,
        angle: -260,
        alpha: 0,
        delay: i * 80,
        duration: 380,
        ease: 'Cubic.easeIn',
        onComplete: () => r.destroy(),
      });
    }
    this.s.cameras.main.flash(260, 150, 120, 255);
  }
}
