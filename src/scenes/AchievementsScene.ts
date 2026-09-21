import Phaser from 'phaser';
import { GAME_H, GAME_W, HEX } from '../config';
import { ACHIEVEMENTS } from '../data/achievements';
import { AUDIO } from '../systems/Audio';
import { Store } from '../systems/Store';
import { fmt, t, tr } from '../i18n';
import {
  background, bindToasts, closeButton, icon, leaveMenu, outlineTexture, plateTexture, ScrollList, shadowTexture, staggerIn, txt, zoomIn,
} from '../ui/Kit';

const VIEW = new Phaser.Geom.Rectangle(28, 128, 664, GAME_H - 150);
const ROW_W = 648;
const ROW_H = 132;
const GAP = 14;

/** Пока только меню: список достижений с прогрессом (награды и логика получения — в следующих версиях). */
export class AchievementsScene extends Phaser.Scene {
  private closing = false;

  constructor() {
    super('Achievements');
  }

  init(): void {
    this.closing = false;
  }

  create(): void {
    background(this);
    bindToasts(this);
    const title = txt(this, GAME_W / 2, 66, t('ach.title'), 54, { font: 'title', color: HEX.gold, strokeThickness: 6 });
    const close = closeButton(this, () => this.close());

    const list = new ScrollList(this, VIEW, ACHIEVEMENTS.length * (ROW_H + GAP) + 20);
    ACHIEVEMENTS.forEach((a, i) => {
      const done = Store.data.achievements.includes(a.id);
      const cur = Math.min(a.target, a.progress(Store.data));
      const row = this.add.container(VIEW.width / 2, i * (ROW_H + GAP) + ROW_H / 2 + 6);
      row.add(this.add.image(0, 7, shadowTexture(this, ROW_W, ROW_H, 26, 14)).setAlpha(0.8));
      row.add(this.add.image(0, 0, plateTexture(this, ROW_W, ROW_H, 1, 'panel', 26)));
      if (done) row.add(this.add.image(0, 0, outlineTexture(this, ROW_W, ROW_H, 26, '#f0c75e', 3)));
      const tx = -ROW_W / 2 + 26;
      row.add(this.add.image(tx + 44, 0, plateTexture(this, 88, 88, 1, done ? 'gold' : 'dark', 24)));
      row.add(icon(this, tx + 44, 0, done ? 'svg_trophy' : 'svgw_trophy', 50).setAlpha(done ? 1 : 0.35));
      const lx = tx + 112;
      row.add(txt(this, lx, -34, tr(a.name), 26, { origin: [0, 0.5], maxWidth: ROW_W - 160, weight: 900, color: done ? HEX.gold : HEX.text }));
      row.add(txt(this, lx, -2, tr(a.desc), 19, { origin: [0, 0.5], maxWidth: ROW_W - 160, weight: 700, strokeThickness: 0, color: HEX.textDim }));
      const bw = 340;
      row.add(this.add.rectangle(lx + bw / 2, 34, bw, 10, 0x000000, 0.5));
      row.add(this.add.rectangle(lx, 34, Math.max(4, (bw * cur) / a.target), 10, done ? 0xf0c75e : 0x7d86a6).setOrigin(0, 0.5));
      row.add(txt(this, ROW_W / 2 - 26, 34, done ? t('ach.done') : `${fmt(cur)}/${fmt(a.target)}`, 20, { origin: [1, 0.5], weight: 900, strokeThickness: 0, color: done ? HEX.good : HEX.textDim }));
      list.content.add(row);
    });
    this.input.keyboard?.on('keydown-ESC', () => this.close());
    zoomIn(this);
    staggerIn(this, [title, close], { dy: -22, delay: 200, gap: 60 });
    // видимые строки въезжают каскадом; остальные (за кадром) остаются на месте — им незачем анимироваться
    staggerIn(this, list.content.list.slice(0, 7), { dy: 40, delay: 300, gap: 60, ms: 380 });
  }

  private close(): void {
    if (this.closing) return;
    this.closing = true;
    AUDIO.play('click');
    leaveMenu(this, 'Hub', { from: 'ach' });
  }
}
