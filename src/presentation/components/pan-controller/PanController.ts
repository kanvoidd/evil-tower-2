import Phaser from 'phaser';

import { COLOR, GAME_H, GAME_W } from '../../theme';
import type { PanBounds } from './interfaces/PanBounds';

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
      this.keys = input.keyboard.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D') as Record<
        string,
        Phaser.Input.Keyboard.Key
      >;
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
      this.setCenter(
        this.centerX + (this.vel.x * dt) / 1000,
        this.centerY + (this.vel.y * dt) / 1000,
      );
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
        this.setCenter(
          this.centerX + ((rt ? 1 : 0) - (lf ? 1 : 0)) * (this.axes === 'xy' ? sp : 0),
          this.centerY + ((dn ? 1 : 0) - (up ? 1 : 0)) * sp,
        );
      }
    }
  }

  private buildBars(): void {
    const s = this.scene;
    this.vTrack = s.add
      .rectangle(GAME_W - 8, 0, 4, 100, 0xffffff, 0.06)
      .setScrollFactor(0)
      .setDepth(900);
    this.vThumb = s.add
      .rectangle(GAME_W - 8, 0, 6, 60, COLOR.scrollbar, 0.55)
      .setScrollFactor(0)
      .setDepth(901)
      .setInteractive({ useHandCursor: true });
    this.vThumb.on('pointerdown', () => (this.thumbDrag = 'v'));
    if (this.axes === 'xy') {
      this.hTrack = s.add
        .rectangle(0, GAME_H - 8, 100, 4, 0xffffff, 0.06)
        .setScrollFactor(0)
        .setDepth(900);
      this.hThumb = s.add
        .rectangle(0, GAME_H - 8, 60, 6, COLOR.scrollbar, 0.55)
        .setScrollFactor(0)
        .setDepth(901)
        .setInteractive({ useHandCursor: true });
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
        this.vThumb
          .setSize(6, th)
          .setPosition(GAME_W - 8, this.zone.y + th / 2 + Phaser.Math.Clamp(t, 0, 1) * (zh - th));
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
        this.hThumb
          .setSize(tw, 6)
          .setPosition(20 + tw / 2 + Phaser.Math.Clamp(t, 0, 1) * (GAME_W - 40 - tw), GAME_H - 8);
      }
    }
  }
}
