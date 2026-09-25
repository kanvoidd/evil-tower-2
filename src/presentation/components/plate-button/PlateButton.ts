import Phaser from 'phaser';
import type { SfxName } from '../../../application/ports';
import { COLOR, HEX } from '../../theme';
import { icon } from '../icon/Icon';
import { pulse, popIn } from '../motion/UiMotion';
import type { PlateStyle } from '../plate/interfaces/PlateStyle';
import { plateTexture, shadowTexture } from '../plate/Plates';
import { fitText, txt } from '../text/Text';
import { UiSound } from '../ui-sound/UiSound';
import type { BtnOpts } from './interfaces/BtnOpts';

/** Кнопка-плита: подпись и/или значок, отклик на нажатие, блокировка, значок «!». */
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
      this.iconImg = icon(scene, 0, 0, PlateButton.iconFor(o.icon, this.style), this.iconSize);
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
        UiSound.play('error');
        this.shake();
        this.onLocked?.();
        return;
      }
      if (this.soundName) UiSound.play(this.soundName);
      this.onClick?.();
    });
    scene.add.existing(this);
  }

  /** Светлые иконки на тёмных кнопках, чёрные — на золотых. */
  private static iconFor(key: string, style: PlateStyle): string {
    return key.startsWith('svg_') && style !== 'gold' ? key.replace('svg_', 'svgw_') : key;
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
      this.iconImg.setTexture(PlateButton.iconFor(key, this.style));
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
