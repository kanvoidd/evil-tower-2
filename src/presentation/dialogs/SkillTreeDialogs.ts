import type Phaser from 'phaser';

import type { ISkillTreeDialogs } from '../../application/skill-tree/interfaces/ISkillTreeDialogs';
import type { ClassId } from '../../domain/catalog';
import { t, type TKey } from '../../i18n';
import { Dialog, icon, plateTexture, txt } from '../components';
import { HEX } from '../theme';

/** Подтверждения метаморфозы и отказа от класса: «было → станет» гербами классов. */
export class SkillTreeDialogs implements ISkillTreeDialogs {
  constructor(private readonly scene: Phaser.Scene) {}

  confirmMetamorphosis(from: ClassId, to: ClassId): Promise<boolean> {
    return new Promise((answer) => {
      new Dialog(this.scene, {
        title: t('meta.title'),
        body: t('meta.body'),
        content: (s, c) => SkillTreeDialogs.classArrow(s, c, from, to),
        buttons: [
          { label: t('common.cancel'), onClick: () => answer(false) },
          { label: t('common.continue'), style: 'gold', onClick: () => answer(true) },
        ],
      });
    });
  }

  confirmCancel(from: ClassId, to: ClassId, refundPct: number): Promise<boolean> {
    return new Promise((answer) => {
      new Dialog(this.scene, {
        title: t('meta.cancel_title'),
        body: t('meta.cancel_body', { pct: refundPct }),
        content: (s, c) => SkillTreeDialogs.classArrow(s, c, from, to),
        buttons: [
          { label: t('common.no'), onClick: () => answer(false) },
          { label: t('common.yes'), style: 'red', onClick: () => answer(true) },
        ],
      });
    });
  }

  /** Два герба и стрелка между ними; возвращает высоту содержимого. */
  private static classArrow(
    scene: Phaser.Scene,
    c: Phaser.GameObjects.Container,
    from: ClassId,
    to: ClassId,
  ): number {
    const mk = (id: ClassId, x: number): void => {
      c.add(scene.add.image(x, 90, `cls_${id}`).setDisplaySize(170, 170));
      c.add(txt(scene, x, 204, t(`class.${id}.name` as TKey), 26, { color: HEX.gold, wrap: 200 }));
    };
    mk(from, -175);
    c.add(scene.add.image(0, 90, plateTexture(scene, 76, 76, 1, 'raised', 38)));
    c.add(icon(scene, 0, 90, 'svgw_arrow', 40));
    mk(to, 175);
    return 236;
  }
}
