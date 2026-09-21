import Phaser from 'phaser';
import type { Lang } from '../types';
import { GAME_W, HEX } from '../config';
import { AUDIO } from '../systems/Audio';
import { Store } from '../systems/Store';
import { setLang, t } from '../i18n';
import type { TKey } from '../i18n';
import { background, closeButton, icon, leaveMenu, PlateButton, plateTexture, shadowTexture, staggerIn, txt, zoomIn } from '../ui/Kit';

const LANGS: Array<{ id: Lang; label: TKey }> = [
  { id: 'ru', label: 'lang.ru' },
  { id: 'en', label: 'lang.en' },
];

const CARD_W = 656;
const TRACK = { x0: 156, x1: 566, y: 292 };

export class SettingsScene extends Phaser.Scene {
  private closing = false;
  private noZoom = false;
  private volIcon!: Phaser.GameObjects.Image;
  private fill!: Phaser.GameObjects.Graphics;
  private knob!: Phaser.GameObjects.Image;
  private pct!: Phaser.GameObjects.Text;

  constructor() {
    super('Settings');
  }

  init(data: { noZoom?: boolean } = {}): void {
    this.closing = false;
    this.noZoom = !!data.noZoom;
  }

  create(): void {
    background(this);
    // группы элементов для каскадного появления: каждая занимает место чуть позже предыдущей
    const groups: Phaser.GameObjects.GameObject[][] = [];
    let from = this.children.list.length;
    const endGroup = (): void => {
      groups.push(this.children.list.slice(from));
      from = this.children.list.length;
    };
    txt(this, GAME_W / 2, 66, t('settings.title'), 54, { font: 'title', color: HEX.gold, strokeThickness: 6 });
    closeButton(this, () => this.close());
    endGroup();

    this.card(GAME_W / 2, 262, 236);
    txt(this, 72, 196, t('settings.volume'), 28, { origin: [0, 0.5], color: HEX.textDim, weight: 800, strokeThickness: 0 });
    this.volIcon = icon(this, 88, TRACK.y, Store.data.volume <= 0 || Store.data.muted ? 'svgw_sound_off' : 'svgw_sound', 54);
    this.add.image((TRACK.x0 + TRACK.x1) / 2, TRACK.y, plateTexture(this, TRACK.x1 - TRACK.x0 + 28, 18, 1, 'dark', 9));
    this.fill = this.add.graphics();
    this.knob = this.add.image(TRACK.x0, TRACK.y, plateTexture(this, 46, 46, 1, 'gold', 23)).setInteractive({ draggable: true, useHandCursor: true });
    this.pct = txt(this, CARD_W + 32 - 36, TRACK.y, '', 28, { origin: [1, 0.5], weight: 900, color: HEX.text });
    this.input.setDraggable(this.knob);
    this.knob.on('drag', (_p: Phaser.Input.Pointer, dragX: number) => this.setVolume(Phaser.Math.Clamp((dragX - TRACK.x0) / (TRACK.x1 - TRACK.x0), 0, 1)));
    this.knob.on('dragend', () => AUDIO.play('click'));
    const zone = this.add.rectangle((TRACK.x0 + TRACK.x1) / 2, TRACK.y, TRACK.x1 - TRACK.x0 + 60, 80, 0x000000, 0.001).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', (p: Phaser.Input.Pointer) => this.setVolume(Phaser.Math.Clamp((p.x - TRACK.x0) / (TRACK.x1 - TRACK.x0), 0, 1)));
    this.layoutVolume(Store.data.volume);
    endGroup();

    this.card(GAME_W / 2, 560, 224);
    txt(this, 72, 500, t('settings.language'), 28, { origin: [0, 0.5], color: HEX.textDim, weight: 800, strokeThickness: 0 });
    LANGS.forEach((l, i) => {
      new PlateButton(this, 216 + i * 288, 588, {
        w: 272, h: 84, label: t(l.label), fontSize: 30, style: Store.lang === l.id ? 'gold' : 'raised', radius: 26,
        onClick: () => {
          if (Store.lang === l.id) return;
          Store.setLang(l.id);
          setLang(l.id);
          this.scene.restart({ noZoom: true });
        },
      });
    });

    endGroup();

    txt(this, GAME_W / 2, 1226, 'Evil Tower 2', 22, { font: 'title', color: HEX.textMute, strokeThickness: 0 });
    endGroup();
    this.input.keyboard?.on('keydown-ESC', () => this.close());
    if (this.noZoom) return;
    zoomIn(this);
    groups.forEach((g, i) => staggerIn(this, g, { dy: i === 0 ? -22 : 30, delay: 200 + i * 110, gap: 0, ms: 380 }));
  }

  private card(x: number, y: number, h: number): void {
    this.add.image(x, y + 8, shadowTexture(this, CARD_W, h, 30, 20)).setAlpha(0.85);
    this.add.image(x, y, plateTexture(this, CARD_W, h, 1, 'panel', 30));
  }

  private setVolume(v: number): void {
    Store.data.volume = v;
    if (v > 0) Store.data.muted = false;
    AUDIO.setVolume(v);
    AUDIO.setMuted(Store.data.muted);
    Store.setAudio(v, Store.data.muted);
    this.layoutVolume(v);
  }

  private layoutVolume(v: number): void {
    const x = TRACK.x0 + (TRACK.x1 - TRACK.x0) * v;
    this.knob.x = x;
    this.fill.clear();
    const w = Math.max(12, x - TRACK.x0 + 6);
    this.fill.fillStyle(0xf0c75e, 1).fillRoundedRect(TRACK.x0 - 6, TRACK.y - 6, w, 12, 6);
    this.pct.setText(`${Math.round(v * 100)}%`);
    this.volIcon.setTexture(v <= 0 || Store.data.muted ? 'svgw_sound_off' : 'svgw_sound');
  }

  private close(): void {
    if (this.closing) return;
    this.closing = true;
    AUDIO.play('click');
    leaveMenu(this, 'Hub', { from: 'settings' });
  }
}
