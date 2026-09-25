import Phaser from 'phaser';

import type { ISettingsView } from '../../../application/settings/interfaces/ISettingsView';
import type { Lang } from '../../../domain/types';
import { t, type TKey } from '../../../i18n';
import {
  background,
  closeButton,
  icon,
  PlateButton,
  plateTexture,
  shadowTexture,
  staggerIn,
  txt,
  UiSound,
} from '../../components';
import { zoomIn } from '../../navigation/SceneTransitions';
import { GAME_W, HEX } from '../../theme';
import type { SettingsViewDeps } from './interfaces/SettingsViewDeps';

/** Настройки: громкость (ползунок) и язык. Изменения экран отдаёт командами. */
export class SettingsView implements ISettingsView {
  private static readonly LANGS: ReadonlyArray<{ id: Lang; label: TKey }> = [
    { id: 'ru', label: 'lang.ru' },
    { id: 'en', label: 'lang.en' },
  ];
  private static readonly CARD_W = 656;
  private static readonly TRACK = { x0: 156, x1: 566, y: 292 } as const;

  private readonly volIcon: Phaser.GameObjects.Image;
  private readonly fill: Phaser.GameObjects.Graphics;
  private readonly knob: Phaser.GameObjects.Image;
  private readonly pct: Phaser.GameObjects.Text;

  constructor(
    private readonly scene: Phaser.Scene,
    d: SettingsViewDeps,
  ) {
    const { TRACK, CARD_W } = SettingsView;
    const s = scene;
    background(s);
    // группы элементов для каскадного появления: каждая занимает место чуть позже предыдущей
    const groups: Phaser.GameObjects.GameObject[][] = [];
    let from = s.children.list.length;
    const endGroup = (): void => {
      groups.push(s.children.list.slice(from));
      from = s.children.list.length;
    };
    txt(s, GAME_W / 2, 66, t('settings.title'), 54, {
      font: 'title',
      color: HEX.gold,
      strokeThickness: 6,
    });
    closeButton(s, () => d.commands({ type: 'close' }));
    endGroup();

    this.card(GAME_W / 2, 262, 236);
    txt(s, 72, 196, t('settings.volume'), 28, {
      origin: [0, 0.5],
      color: HEX.textDim,
      weight: 800,
      strokeThickness: 0,
    });
    this.volIcon = icon(s, 88, TRACK.y, d.silent ? 'svgw_sound_off' : 'svgw_sound', 54);
    s.add.image(
      (TRACK.x0 + TRACK.x1) / 2,
      TRACK.y,
      plateTexture(s, TRACK.x1 - TRACK.x0 + 28, 18, 1, 'dark', 9),
    );
    this.fill = s.add.graphics();
    this.knob = s.add
      .image(TRACK.x0, TRACK.y, plateTexture(s, 46, 46, 1, 'gold', 23))
      .setInteractive({ draggable: true, useHandCursor: true });
    this.pct = txt(s, CARD_W + 32 - 36, TRACK.y, '', 28, {
      origin: [1, 0.5],
      weight: 900,
      color: HEX.text,
    });
    s.input.setDraggable(this.knob);
    const volumeAt = (x: number): void =>
      d.commands({
        type: 'volume',
        value: Phaser.Math.Clamp((x - TRACK.x0) / (TRACK.x1 - TRACK.x0), 0, 1),
      });
    this.knob.on('drag', (_p: Phaser.Input.Pointer, dragX: number) => volumeAt(dragX));
    this.knob.on('dragend', () => UiSound.play('click'));
    const zone = s.add
      .rectangle((TRACK.x0 + TRACK.x1) / 2, TRACK.y, TRACK.x1 - TRACK.x0 + 60, 80, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerdown', (p: Phaser.Input.Pointer) => volumeAt(p.x));
    this.showVolume(d.volume, d.silent);
    endGroup();

    this.card(GAME_W / 2, 560, 224);
    txt(s, 72, 500, t('settings.language'), 28, {
      origin: [0, 0.5],
      color: HEX.textDim,
      weight: 800,
      strokeThickness: 0,
    });
    SettingsView.LANGS.forEach((l, i) => {
      new PlateButton(s, 216 + i * 288, 588, {
        w: 272,
        h: 84,
        label: t(l.label),
        fontSize: 30,
        style: d.lang === l.id ? 'gold' : 'raised',
        radius: 26,
        onClick: () => d.commands({ type: 'language', lang: l.id }),
      });
    });
    endGroup();

    txt(s, GAME_W / 2, 1226, 'Evil Tower 2', 22, {
      font: 'title',
      color: HEX.textMute,
      strokeThickness: 0,
    });
    endGroup();
    s.input.keyboard?.on('keydown-ESC', () => d.commands({ type: 'close' }));
    if (d.noZoom) return;
    zoomIn(s);
    groups.forEach((g, i) =>
      staggerIn(s, g, { dy: i === 0 ? -22 : 30, delay: 200 + i * 110, gap: 0, ms: 380 }),
    );
  }

  showVolume(volume: number, silent: boolean): void {
    const { TRACK } = SettingsView;
    const x = TRACK.x0 + (TRACK.x1 - TRACK.x0) * volume;
    this.knob.x = x;
    this.fill.clear();
    const w = Math.max(12, x - TRACK.x0 + 6);
    this.fill.fillStyle(0xf0c75e, 1).fillRoundedRect(TRACK.x0 - 6, TRACK.y - 6, w, 12, 6);
    this.pct.setText(`${Math.round(volume * 100)}%`);
    this.volIcon.setTexture(silent ? 'svgw_sound_off' : 'svgw_sound');
  }

  private card(x: number, y: number, h: number): void {
    const s = this.scene;
    const w = SettingsView.CARD_W;
    s.add.image(x, y + 8, shadowTexture(s, w, h, 30, 20)).setAlpha(0.85);
    s.add.image(x, y, plateTexture(s, w, h, 1, 'panel', 30));
  }
}
