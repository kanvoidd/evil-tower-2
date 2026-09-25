import type Phaser from 'phaser';

import type { IClassSelectDialogs } from '../../application/class-select/interfaces/IClassSelectDialogs';
import type { ClassId } from '../../domain/types';
import { t, type TKey } from '../../i18n';
import { Dialog, pulse } from '../components';

/** Подтверждение смены героя — с гербом нового героя. */
export class ClassSelectDialogs implements IClassSelectDialogs {
  constructor(private readonly scene: Phaser.Scene) {}

  confirmSwitch(classId: ClassId): Promise<boolean> {
    return new Promise((answer) => {
      new Dialog(this.scene, {
        title: t('select.change_title'),
        body: t('select.change_body', { name: t(`class.${classId}.name` as TKey) }),
        content: (scene, c) => {
          const img = scene.add.image(0, 96, `cls_${classId}`).setDisplaySize(190, 190);
          c.add(img);
          pulse(scene, img, 3200, 1.04);
          return 200;
        },
        buttons: [
          { label: t('common.cancel'), onClick: () => answer(false) },
          { label: t('common.continue'), style: 'gold', onClick: () => answer(true) },
        ],
      });
    });
  }
}
