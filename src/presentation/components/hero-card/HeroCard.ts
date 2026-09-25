import Phaser from 'phaser';

import { CLASSES, type EquipmentSave, ITEM_BY_ID, LINEAGES } from '../../../domain/catalog';
import { t, type TKey } from '../../../i18n';
import { LINEAGE_COLOR } from '../../textures/Textures';
import { COLOR, HEX } from '../../theme';
import { icon } from '../icon/Icon';
import { outlineTexture, plateTexture, shadowTexture } from '../plate/Plates';
import { statChip } from '../stat-badge/StatBadges';
import { txt } from '../text/Text';
import type { IHeroCardSource } from './interfaces/IHeroCardSource';

/**
 * Карточка персонажа игрока — общая для главного экрана и лавки.
 * full — с ячейками снаряжения и кнопкой «Развитие»; compact — только портрет и характеристики.
 */
export class HeroCard {
  static readonly W = 264;
  static readonly H = 672;
  static readonly H_COMPACT = 486;

  private static readonly RES_COLOR: Record<string, string> = {
    stamina: '#e9c94a',
    mana: '#5aa0ff',
    concentration: '#4fd98c',
    vigilance: '#b98cff',
  };

  readonly root: Phaser.GameObjects.Container;
  readonly frame: Phaser.GameObjects.Image;
  readonly badge: Phaser.GameObjects.Container;
  readonly hitArea: Phaser.GameObjects.Zone;
  readonly height: number;

  constructor(scene: Phaser.Scene, x: number, y: number, hero: IHeroCardSource, full: boolean) {
    const h = full ? HeroCard.H : HeroCard.H_COMPACT;
    const w = HeroCard.W;
    const top = -h / 2;
    const root = scene.add.container(x, y);
    const classId = hero.activeClass;
    const lineage = CLASSES[classId].lineage;
    const lcol = Phaser.Display.Color.HexStringToColor(LINEAGE_COLOR[lineage]).color;

    root.add(scene.add.image(0, 10, shadowTexture(scene, w, h, 30, 22)).setAlpha(0.9));
    root.add(scene.add.image(0, 0, plateTexture(scene, w, h, 1, 'panel', 30)));
    root.add(
      scene.add
        .image(0, top + 116, 'glow')
        .setTint(lcol)
        .setDisplaySize(380, 380)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0.5),
    );
    const frame = scene.add
      .image(0, 0, outlineTexture(scene, w, h, 30, '#f0c75e', 3))
      .setAlpha(0.85);
    root.add(frame);

    const sprite = scene.add.image(0, top + 112, `hero_${classId}`).setDisplaySize(190, 190);
    root.add(sprite);
    scene.tweens.add({
      targets: sprite,
      y: sprite.y - 5,
      duration: 1900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    root.add(
      txt(scene, 0, top + 232, t(`class.${classId}.name` as TKey), 38, {
        font: 'title',
        color: HEX.gold,
        maxWidth: w - 36,
        strokeThickness: 0,
      }),
    );
    const res = LINEAGES[lineage].resource;
    // название ресурса класса — просто цветное слово, без точки-маркера
    root.add(
      txt(scene, 0, top + 266, t(`res.${res}` as TKey), 20, {
        color: HeroCard.RES_COLOR[res],
        weight: 800,
        strokeThickness: 0,
      }),
    );
    root.add(
      scene.add
        .image(0, top + 292, 'px')
        .setTint(0xffffff)
        .setAlpha(0.1)
        .setDisplaySize(w - 56, 2),
    );

    const ps = hero.playerStats();
    const rows: Array<[string, string]> = [
      ['health', String(ps.maxHp)],
      ['damage', String(ps.damage)],
      ['defense', String(ps.defense)],
      ['crit', `${Math.round(ps.crit)}%`],
      ['dodge', `${Math.round(ps.dodge)}%`],
      ['parry', `${Math.round(ps.parry)}%`],
    ];
    rows.forEach(([stat, val], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      root.add(statChip(scene, col ? 26 : -86, top + 328 + row * 54, stat, val, 38, 25));
    });

    if (full) {
      const slot = (sx: number, item: EquipmentSave | null, label: TKey): void => {
        const sy = top + 514;
        root.add(scene.add.image(sx, sy, plateTexture(scene, 78, 78, 1, 'dark', 20)));
        if (item) {
          const def = ITEM_BY_ID[item.id];
          root.add(icon(scene, sx, sy - 4, def.icon, 54));
          const k = Phaser.Math.Clamp(item.durability / def.durability, 0, 1);
          root.add(scene.add.rectangle(sx, sy + 28, 50, 5, 0x000000, 0.5));
          root.add(
            scene.add
              .rectangle(sx - 25, sy + 28, Math.max(2, 50 * k), 5, k > 0.25 ? 0x66e39c : 0xff7468)
              .setOrigin(0, 0.5),
          );
        } else {
          root.add(
            txt(scene, sx, sy, '+', 40, { color: HEX.textMute, strokeThickness: 0, weight: 900 }),
          );
        }
        root.add(
          txt(scene, sx, sy + 54, t(label), 16, {
            color: HEX.textMute,
            strokeThickness: 0,
            weight: 700,
          }),
        );
      };
      slot(-54, hero.equipped('weapon'), 'slot.weapon');
      slot(54, hero.equipped('armor'), 'slot.armor');

      const cy = top + 626;
      const cta = scene.add.container(0, cy);
      cta.add(scene.add.image(0, 0, plateTexture(scene, w - 32, 62, 1, 'gold', 22)));
      const label = txt(scene, -10, -1, t('skill.title'), 27, {
        color: '#2b1c06',
        strokeThickness: 0,
        maxWidth: 150,
      });
      cta.add(label);
      cta.add(icon(scene, label.x + label.width / 2 + 22, 0, 'svg_chevron', 20));
      root.add(cta);
      scene.tweens.add({
        targets: cta,
        alpha: { from: 0.86, to: 1 },
        duration: 1700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    const badge = scene.add.container(w / 2 - 6, top + 6).setVisible(false);
    badge.add([
      scene.add.circle(0, 0, 16, COLOR.red).setStrokeStyle(3, 0x0b0d12),
      txt(scene, 0, -1, '!', 22, { color: '#fff', strokeThickness: 0, weight: 900 }),
    ]);
    root.add(badge);

    const hitArea = scene.add.zone(0, 0, w, h);
    root.add(hitArea);
    root.setSize(w, h);
    scene.tweens.add({
      targets: frame,
      alpha: { from: 0.55, to: 1 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.root = root;
    this.frame = frame;
    this.badge = badge;
    this.hitArea = hitArea;
    this.height = h;
  }
}
