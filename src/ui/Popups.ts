import Phaser from 'phaser';
import { DAILY_REWARDS, GIFT_REWARD } from '../data/economy';
import { HEX } from '../config';
import { Store } from '../systems/Store';
import { watchRewarded } from '../systems/Ads';
import { AUDIO } from '../systems/Audio';
import { fmt, t } from '../i18n';
import { Dialog, icon, plateTexture, toast, txt } from './Kit';

type Reward = { gold?: number; souls?: number; heal?: number; regen?: number };

const rewardParts = (r: Reward): Array<{ key: string; amount: number; color: string }> => {
  const out: Array<{ key: string; amount: number; color: string }> = [];
  if (r.gold) out.push({ key: 'ico_gold', amount: r.gold, color: HEX.gold });
  if (r.souls) out.push({ key: 'ico_soul', amount: r.souls, color: HEX.soul });
  if (r.heal) out.push({ key: 'item_potion_heal', amount: r.heal, color: HEX.text });
  if (r.regen) out.push({ key: 'item_potion_regen', amount: r.regen, color: HEX.text });
  return out;
};

/** Ежедневная награда: 7-дневный цикл. Второй вариант — удвоить за просмотр видео. */
export const openDailyReward = (scene: Phaser.Scene, onDone?: () => void): void => {
  const st = Store.dailyStatus();
  if (!st.available) return;
  new Dialog(scene, {
    title: t('daily.title'),
    width: 640,
    content: (s, c) => {
      const cw = 128;
      const ch = 128;
      const gap = 12;
      DAILY_REWARDS.forEach((r, i) => {
        const perRow = i < 4 ? 4 : 3;
        const col = i < 4 ? i : i - 4;
        const x = (col - (perRow - 1) / 2) * (cw + gap);
        const y = (i < 4 ? 0 : 1) * (ch + gap) + ch / 2;
        const today = i === st.dayIndex;
        const done = i < st.dayIndex;
        const cell = s.add.container(x, y);
        cell.add(s.add.image(0, 0, plateTexture(s, cw, ch, 1, today ? 'gold' : done ? 'dark' : 'panel', 22)));
        cell.add(txt(s, 0, -44, t('daily.day', { n: i + 1 }), 18, {
          color: today ? '#5a3d0e' : HEX.textMute, strokeThickness: 0, weight: 800,
        }));
        const parts = rewardParts(r);
        const shown = parts.slice(0, 2);
        const extra = parts.length > 2;
        shown.forEach((p, k) => {
          const py = shown.length > 1 ? (extra ? -12 : -8) + k * (extra ? 34 : 40) : 10;
          const label = txt(s, 0, py, fmt(p.amount), 24, { color: today ? '#2b1c06' : p.color, strokeThickness: 0, weight: 900, origin: [0, 0.5] });
          const total = 34 + 8 + label.width;
          const im = s.add.image(-total / 2 + 17, py, p.key).setDisplaySize(34, 34);
          label.setX(-total / 2 + 42);
          cell.add([im, label]);
        });
        if (extra) cell.add(txt(s, 0, 52, `+${parts.length - 2}`, 17, { color: today ? '#5a3d0e' : HEX.textDim, strokeThickness: 0, weight: 800 }));
        if (done) {
          cell.add(s.add.rectangle(0, 0, cw, ch, 0x000000, 0.35));
          cell.add(icon(s, 0, 6, 'svgw_check', 40));
        }
        if (today) s.tweens.add({ targets: cell, scale: 1.04, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        c.add(cell);
      });
      return 2 * ch + gap;
    },
    buttons: [
      {
        label: t('daily.claim'),
        style: 'gold',
        onClick: () => {
          Store.claimDaily(1);
          AUDIO.play('reward');
          toast(scene, t('toast.reward'));
          onDone?.();
        },
      },
      {
        label: t('daily.double'),
        icon: 'svg_video',
        style: 'green',
        onClick: () => {
          void watchRewarded().then((ok) => {
            Store.claimDaily(ok ? 2 : 1);
            toast(scene, t('toast.reward'));
            onDone?.();
          });
        },
      },
    ],
  });
};

/** Дар башни: бесплатный подарок раз в несколько минут (можно удвоить видео). */
export const openGift = (scene: Phaser.Scene, onDone?: () => void): void => {
  if (!Store.giftReady()) return;
  new Dialog(scene, {
    title: t('gift.title'),
    body: t('gift.body'),
    content: (s, c) => {
      const row = (key: string, val: number, y: number, color: string): void => {
        const label = txt(s, 0, y, `+${val}`, 44, { color, weight: 900, origin: [0, 0.5] });
        const total = 56 + 14 + label.width;
        label.setX(-total / 2 + 70);
        c.add(s.add.image(-total / 2 + 28, y, key).setDisplaySize(56, 56));
        c.add(label);
      };
      row('ico_gold', GIFT_REWARD.gold, 34, HEX.gold);
      row('ico_soul', GIFT_REWARD.souls, 104, HEX.soul);
      return 140;
    },
    buttons: [
      {
        label: t('common.claim'),
        style: 'gold',
        onClick: () => {
          Store.claimGift(1);
          toast(scene, t('toast.reward'));
          onDone?.();
        },
      },
      {
        label: t('daily.double'),
        icon: 'svg_video',
        style: 'green',
        onClick: () => {
          void watchRewarded().then((ok) => {
            Store.claimGift(ok ? 2 : 1);
            toast(scene, t('toast.reward'));
            onDone?.();
          });
        },
      },
    ],
  });
};
