import Phaser from 'phaser';

import type { RoomDef, RoomModifier } from '../../domain/data/levels';
import { t, type TKey } from '../../i18n';
import { tipOnHover, txt } from '../components';
import { GAME_W, HEX } from '../theme';

/** Шапка боя: этаж и номер комнаты, под ними — рогаликовое свойство захода с подсказкой по наведению. */
export class RoomInfo {
  constructor(scene: Phaser.Scene, room: RoomDef, mod: RoomModifier) {
    txt(
      scene,
      GAME_W / 2,
      150,
      `${t(`floor.${room.floor}.name` as TKey)} · ${t('game.room', { r: room.id })}`,
      30,
      {
        font: 'title',
        color: HEX.gold,
        strokeThickness: 5,
      },
    );
    if (mod.id === 'plain') return;
    const label = txt(scene, 0, 0, t(`mod.${mod.id}` as TKey), 21, {
      color: HEX.soul,
      weight: 900,
      strokeThickness: 3,
    });
    const holder = scene.add.container(GAME_W / 2, 180, [label]);
    holder
      .setSize(label.width + 40, 34)
      .setInteractive(
        new Phaser.Geom.Rectangle(0, 0, label.width + 40, 34),
        Phaser.Geom.Rectangle.Contains,
      );
    tipOnHover(
      scene,
      holder,
      () => `${t(`mod.${mod.id}` as TKey)}\n${t(`mod.${mod.id}.desc` as TKey)}`,
    );
  }
}
