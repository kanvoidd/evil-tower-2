import type Phaser from 'phaser';

import type { IHubDialogs } from '../../application/hub/interfaces/IHubDialogs';
import type { RewardChoice } from '../../application/rewards/interfaces/RewardChoice';
import type { DailyStatus } from '../../domain/account/profile';
import { DAILY_REWARDS, type DailyReward } from '../../domain/rewards/daily';
import { GIFT_REWARD } from '../../domain/rewards/tower-gift';
import { fmt, t } from '../../i18n';
import { Dialog, icon, plateTexture, txt, UiSound } from '../components';
import { HEX } from '../theme';
import type { RewardPart } from './interfaces/RewardPart';

/** Окна хаба: ежедневная награда (семидневный цикл) и «Дар башни». Второй вариант — удвоить за видео. */
export class HubDialogs implements IHubDialogs {
  constructor(private readonly scene: Phaser.Scene) {}

  daily(status: DailyStatus): Promise<RewardChoice> {
    return new Promise((choose) => {
      new Dialog(this.scene, {
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
            const today = i === status.dayIndex;
            const done = i < status.dayIndex;
            const cell = s.add.container(x, y);
            cell.add(
              s.add.image(
                0,
                0,
                plateTexture(s, cw, ch, 1, today ? 'gold' : done ? 'dark' : 'panel', 22),
              ),
            );
            cell.add(
              txt(s, 0, -44, t('daily.day', { n: i + 1 }), 18, {
                color: today ? '#5a3d0e' : HEX.textMute,
                strokeThickness: 0,
                weight: 800,
              }),
            );
            const parts = HubDialogs.rewardParts(r);
            const shown = parts.slice(0, 2);
            const extra = parts.length > 2;
            shown.forEach((p, k) => {
              const py = shown.length > 1 ? (extra ? -12 : -8) + k * (extra ? 34 : 40) : 10;
              const label = txt(s, 0, py, fmt(p.amount), 24, {
                color: today ? '#2b1c06' : p.color,
                strokeThickness: 0,
                weight: 900,
                origin: [0, 0.5],
              });
              const total = 34 + 8 + label.width;
              const im = s.add.image(-total / 2 + 17, py, p.key).setDisplaySize(34, 34);
              label.setX(-total / 2 + 42);
              cell.add([im, label]);
            });
            if (extra)
              cell.add(
                txt(s, 0, 52, `+${parts.length - 2}`, 17, {
                  color: today ? '#5a3d0e' : HEX.textDim,
                  strokeThickness: 0,
                  weight: 800,
                }),
              );
            if (done) {
              cell.add(s.add.rectangle(0, 0, cw, ch, 0x000000, 0.35));
              cell.add(icon(s, 0, 6, 'svgw_check', 40));
            }
            if (today)
              s.tweens.add({
                targets: cell,
                scale: 1.04,
                duration: 1500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
              });
            c.add(cell);
          });
          return 2 * ch + gap;
        },
        buttons: [
          {
            label: t('daily.claim'),
            style: 'gold',
            onClick: () => {
              UiSound.play('reward');
              choose('single');
            },
          },
          {
            label: t('daily.double'),
            icon: 'svg_video',
            style: 'green',
            onClick: () => choose('double'),
          },
        ],
      });
    });
  }

  gift(): Promise<RewardChoice> {
    return new Promise((choose) => {
      new Dialog(this.scene, {
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
          { label: t('common.claim'), style: 'gold', onClick: () => choose('single') },
          {
            label: t('daily.double'),
            icon: 'svg_video',
            style: 'green',
            onClick: () => choose('double'),
          },
        ],
      });
    });
  }

  /** Из чего состоит награда дня — в порядке показа. */
  private static rewardParts(r: DailyReward): RewardPart[] {
    const out: RewardPart[] = [];
    if (r.gold) out.push({ key: 'ico_gold', amount: r.gold, color: HEX.gold });
    if (r.souls) out.push({ key: 'ico_soul', amount: r.souls, color: HEX.soul });
    if (r.heal) out.push({ key: 'item_potion_heal', amount: r.heal, color: HEX.text });
    if (r.regen) out.push({ key: 'item_potion_regen', amount: r.regen, color: HEX.text });
    return out;
  }
}
