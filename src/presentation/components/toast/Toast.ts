import type Phaser from 'phaser';

import { ACHIEVEMENTS } from '../../../domain/rewards';
import type { Signal } from '../../../domain/shared';
import { t, tr } from '../../../i18n';
import { COLOR, GAME_W } from '../../theme';
import { icon } from '../icon/Icon';
import { plateTexture, shadowTexture } from '../plate/Plates';
import { txt } from '../text/Text';
import { UiSound } from '../ui-sound/UiSound';

/** Занятые строки тостов: одновременные тосты встают друг под другом. */
const toastSlots: boolean[] = [];

/** Всплывающее сообщение сверху экрана; само уезжает через пару секунд. */
export const toast = (scene: Phaser.Scene, text: string, iconKey?: string): void => {
  let slot = toastSlots.findIndex((used) => !used);
  if (slot < 0) slot = toastSlots.length;
  toastSlots[slot] = true;
  const y = 84 + slot * 84;
  const c = scene.add
    .container(GAME_W / 2, -80)
    .setDepth(2000)
    .setScrollFactor(0);
  const label = txt(scene, 0, 0, text, 24, { wrap: 480, strokeThickness: 0 });
  const iw = iconKey ? 52 : 0;
  const w = Math.min(640, label.width + 64 + iw);
  const h = 68;
  c.add(scene.add.image(0, 8, shadowTexture(scene, w, h, 34, 14)).setAlpha(0.9));
  c.add(scene.add.image(0, 0, plateTexture(scene, w, h, 1, 'panel', 34)));
  c.add(scene.add.rectangle(-w / 2 + 14, 0, 4, h - 30, COLOR.gold).setAlpha(0.9));
  label.setPosition(iw / 2 + 4, -1);
  c.add(label);
  if (iconKey)
    c.add(
      icon(
        scene,
        -w / 2 + 50,
        0,
        iconKey.startsWith('svg_') ? iconKey.replace('svg_', 'svgw_') : iconKey,
        38,
      ),
    );
  scene.tweens.add({
    targets: c,
    y,
    duration: 320,
    ease: 'Back.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: c,
        y: -100,
        alpha: 0,
        delay: 2200,
        duration: 300,
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
  UiSound.play('reward');
};

/** Показывает тост при получении достижения, пока сцена активна. */
export const bindAchievementToasts = (scene: Phaser.Scene, unlocked: Signal<[string]>): void => {
  const fn = (id: string): void => {
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (a) toast(scene, t('toast.achievement', { name: tr(a.name) }), 'svg_trophy');
  };
  unlocked.on(fn);
  scene.events.once('shutdown', () => unlocked.off(fn));
};
