import Phaser from 'phaser';

import { ACHIEVEMENTS } from '../../../domain/data/achievements';
import { fmt, t, tr } from '../../../i18n';
import {
  background,
  closeButton,
  icon,
  outlineTexture,
  plateTexture,
  ScrollList,
  shadowTexture,
  staggerIn,
  txt,
} from '../../components';
import { zoomIn } from '../../navigation/SceneTransitions';
import { GAME_H, GAME_W, HEX } from '../../theme';
import type { AchievementsViewDeps } from './interfaces/AchievementsViewDeps';

/** Список достижений с прогрессом: открытые — золотые, у остальных полоса «сколько из скольких». */
export class AchievementsView {
  private static readonly VIEW = new Phaser.Geom.Rectangle(28, 128, 664, GAME_H - 150);
  private static readonly ROW_W = 648;
  private static readonly ROW_H = 132;
  private static readonly GAP = 14;

  constructor(scene: Phaser.Scene, d: AchievementsViewDeps) {
    const { VIEW, ROW_W, ROW_H, GAP } = AchievementsView;
    const s = scene;
    background(s);
    const title = txt(s, GAME_W / 2, 66, t('ach.title'), 54, {
      font: 'title',
      color: HEX.gold,
      strokeThickness: 6,
    });
    const close = closeButton(s, () => d.exit.leave());

    const list = new ScrollList(s, VIEW, ACHIEVEMENTS.length * (ROW_H + GAP) + 20);
    ACHIEVEMENTS.forEach((a, i) => {
      const done = d.progress.achievements.includes(a.id);
      const cur = d.progress.achievementProgress(a);
      const row = s.add.container(VIEW.width / 2, i * (ROW_H + GAP) + ROW_H / 2 + 6);
      row.add(s.add.image(0, 7, shadowTexture(s, ROW_W, ROW_H, 26, 14)).setAlpha(0.8));
      row.add(s.add.image(0, 0, plateTexture(s, ROW_W, ROW_H, 1, 'panel', 26)));
      if (done) row.add(s.add.image(0, 0, outlineTexture(s, ROW_W, ROW_H, 26, '#f0c75e', 3)));
      const tx = -ROW_W / 2 + 26;
      row.add(s.add.image(tx + 44, 0, plateTexture(s, 88, 88, 1, done ? 'gold' : 'dark', 24)));
      row.add(
        icon(s, tx + 44, 0, done ? 'svg_trophy' : 'svgw_trophy', 50).setAlpha(done ? 1 : 0.35),
      );
      const lx = tx + 112;
      row.add(
        txt(s, lx, -34, tr(a.name), 26, {
          origin: [0, 0.5],
          maxWidth: ROW_W - 160,
          weight: 900,
          color: done ? HEX.gold : HEX.text,
        }),
      );
      row.add(
        txt(s, lx, -2, tr(a.desc), 19, {
          origin: [0, 0.5],
          maxWidth: ROW_W - 160,
          weight: 700,
          strokeThickness: 0,
          color: HEX.textDim,
        }),
      );
      const bw = 340;
      row.add(s.add.rectangle(lx + bw / 2, 34, bw, 10, 0x000000, 0.5));
      row.add(
        s.add
          .rectangle(lx, 34, Math.max(4, (bw * cur) / a.target), 10, done ? 0xf0c75e : 0x7d86a6)
          .setOrigin(0, 0.5),
      );
      row.add(
        txt(s, ROW_W / 2 - 26, 34, done ? t('ach.done') : `${fmt(cur)}/${fmt(a.target)}`, 20, {
          origin: [1, 0.5],
          weight: 900,
          strokeThickness: 0,
          color: done ? HEX.good : HEX.textDim,
        }),
      );
      list.content.add(row);
    });
    s.input.keyboard?.on('keydown-ESC', () => d.exit.leave());
    zoomIn(s);
    staggerIn(s, [title, close], { dy: -22, delay: 200, gap: 60 });
    // видимые строки въезжают каскадом; остальные (за кадром) остаются на месте — им незачем анимироваться
    staggerIn(s, list.content.list.slice(0, 7), { dy: 40, delay: 300, gap: 60, ms: 380 });
  }
}
