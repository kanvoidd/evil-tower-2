import type Phaser from 'phaser';

import type { IGameDialogs } from '../../application/game/interfaces/IGameDialogs';
import type { RoomClearSummary } from '../../application/game/interfaces/RoomClearSummary';
import type { RunSummary } from '../../application/game/interfaces/RunSummary';
import { fmt, t } from '../../i18n';
import { Dialog, type DialogBtn, type PlateButton, toast, txt } from '../components';
import { HEX } from '../theme';

/** Модальные окна боя: побег, итог комнаты, гибель, итог забега. Каждое отвечает выбором игрока. */
export class GameDialogs implements IGameDialogs {
  constructor(private readonly scene: Phaser.Scene) {}

  confirmEscape(o: { keepsRooms: boolean; lootAtStake: boolean }): Promise<boolean> {
    return new Promise((resolve) => {
      new Dialog(this.scene, {
        title: t('game.escape_title'),
        body:
          [o.keepsRooms ? t('game.escape_keep') : '', o.lootAtStake ? t('game.escape_warn') : '']
            .filter(Boolean)
            .join('\n') || undefined,
        buttons: [
          { label: t('game.escape'), style: 'red', onClick: () => resolve(true) },
          { label: t('common.continue'), style: 'gold', onClick: () => resolve(false) },
        ],
      });
    });
  }

  /** Между комнатами: что принесла эта, сколько здоровья осталось — и решение, идти ли выше. */
  roomCleared(o: RoomClearSummary): Promise<'next' | 'cashout'> {
    return new Promise((resolve) => {
      new Dialog(this.scene, {
        title: t('game.win'),
        titleColor: HEX.gold,
        vertical: true,
        width: 620,
        content: (s, c) => {
          let y = 6;
          y = this.rewardRows(s, c, y, o.gold, o.souls);
          if (o.flawless) {
            c.add(
              txt(s, 0, y + 12, t('game.flawless'), 24, { color: HEX.gold, strokeThickness: 0 }),
            );
            y += 36;
          }
          const hpColor = o.hp < o.maxHp * 0.35 ? HEX.bad : HEX.good;
          c.add(
            txt(s, 0, y + 14, t('game.hp_left', { hp: o.hp, max: o.maxHp }), 26, {
              color: hpColor,
              weight: 900,
              strokeThickness: 0,
            }),
          );
          y += 40;
          c.add(
            txt(s, 0, y + 12, t('game.run_so_far', { n: o.rooms }), 22, {
              color: HEX.textDim,
              weight: 800,
              strokeThickness: 0,
            }),
          );
          return y + 36;
        },
        buttons: [
          {
            label: t('game.next_room_id', { r: o.nextRoomId }),
            style: 'gold',
            onClick: () => resolve('next'),
          },
          { label: t('game.cash_out'), style: 'raised', onClick: () => resolve('cashout') },
        ],
      });
    });
  }

  died(o: {
    canRevive: boolean;
    lootLost: boolean;
    keepsRooms: boolean;
  }): Promise<'revive' | 'end'> {
    return new Promise((resolve) => {
      const buttons: DialogBtn[] = [];
      if (o.canRevive) {
        buttons.push({
          label: t('game.revive'),
          icon: 'svg_video',
          style: 'green',
          onClick: () => resolve('revive'),
        });
      }
      buttons.push({
        label: t('game.end_run'),
        style: o.canRevive ? 'raised' : 'gold',
        onClick: () => resolve('end'),
      });
      new Dialog(this.scene, {
        title: t('game.lose'),
        titleColor: HEX.bad,
        vertical: true,
        width: 620,
        body:
          [o.lootLost ? t('game.loot_lost') : '', o.keepsRooms ? t('game.escape_keep') : '']
            .filter(Boolean)
            .join('\n') || undefined,
        buttons,
      });
    });
  }

  runOver(o: RunSummary, double: () => Promise<boolean>): Promise<'new-run' | 'hub'> {
    const s = this.scene;
    if (o.autoBuys > 0) toast(s, t('auto.skill.result', { n: o.autoBuys }), 'ico_soul');
    return new Promise((resolve) => {
      const buttons: DialogBtn[] = [];
      let doubled = false;
      let doubleBtn: PlateButton | undefined;
      if (o.canDouble) {
        buttons.push({
          label: t('game.double'),
          icon: 'svg_video',
          style: 'green',
          keep: true,
          ref: (b) => (doubleBtn = b),
          onClick: () => {
            if (doubled) return;
            void double().then((ok) => {
              if (!ok) return;
              doubled = true;
              toast(s, t('toast.reward'));
              doubleBtn?.setLocked(true).setLabel(t('toast.reward'));
              doubleBtn?.iconImg?.setVisible(false);
            });
          },
        });
      }
      buttons.push({ label: t('game.new_run'), style: 'gold', onClick: () => resolve('new-run') });
      buttons.push({ label: t('game.to_hub'), style: 'raised', onClick: () => resolve('hub') });

      new Dialog(s, {
        title: o.reason === 'complete' ? t('game.run_done') : t('game.run_over'),
        titleColor: o.reason === 'complete' ? HEX.gold : o.reason === 'dead' ? HEX.bad : HEX.text,
        vertical: true,
        width: 620,
        content: (sc, cont) => {
          let y = 6;
          cont.add(
            txt(sc, 0, y + 20, t('game.run_rooms', { n: o.rooms, max: o.maxRooms }), 32, {
              font: 'title',
              color: HEX.gold,
              strokeThickness: 0,
            }),
          );
          y += 48;
          if (o.record) {
            cont.add(
              txt(sc, 0, y + 12, t('game.new_record'), 26, {
                color: HEX.good,
                weight: 900,
                strokeThickness: 0,
              }),
            );
            y += 38;
          } else {
            cont.add(
              txt(sc, 0, y + 12, t('game.record', { n: o.best }), 22, {
                color: HEX.textDim,
                weight: 800,
                strokeThickness: 0,
              }),
            );
            y += 34;
          }
          y = this.rewardRows(sc, cont, y + 4, o.gold, o.souls);
          if (o.lootLost) {
            cont.add(
              txt(sc, 0, y + 12, t('game.loot_lost'), 22, {
                color: HEX.bad,
                strokeThickness: 0,
                wrap: 540,
              }),
            );
            y += 34;
          }
          return y + 4;
        },
        buttons,
      });
    });
  }

  /** Строки «+золото» и «+души» по центру окна. */
  private rewardRows(
    s: Phaser.Scene,
    c: Phaser.GameObjects.Container,
    y0: number,
    gold: number,
    souls: number,
  ): number {
    let y = y0;
    const row = (key: string, text: string, color: string): void => {
      const label = txt(s, 0, y + 28, text, 40, { color, weight: 900, origin: [0, 0.5] });
      const total = 52 + 14 + label.width;
      c.add(s.add.image(-total / 2 + 26, y + 28, key).setDisplaySize(52, 52));
      label.setX(-total / 2 + 66);
      c.add(label);
      y += 62;
    };
    row('ico_gold', `+${fmt(gold)}`, HEX.gold);
    if (souls > 0) row('ico_soul', `+${fmt(souls)}`, HEX.soul);
    return y;
  }
}
