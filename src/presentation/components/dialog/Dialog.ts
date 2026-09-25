import Phaser from 'phaser';
import { COLOR, GAME_H, GAME_W, HEX } from '../../theme';
import { plateTexture, shadowTexture } from '../plate/Plates';
import { PlateButton } from '../plate-button/PlateButton';
import { pinToScreen } from '../screen-pin/ScreenPin';
import { txt } from '../text/Text';
import { hideTip } from '../tooltip/Tooltip';
import { UiSound } from '../ui-sound/UiSound';
import type { DialogOpts } from './interfaces/DialogOpts';

/** Модальное окно: затемнение, заголовок, текст или своё содержимое и ряд (или столбец) кнопок. */
export class Dialog extends Phaser.GameObjects.Container {
  private closed = false;

  constructor(scene: Phaser.Scene, o: DialogOpts) {
    super(scene, GAME_W / 2, GAME_H / 2);
    this.setDepth(1000).setScrollFactor(0);
    hideTip(scene);
    const width = o.width ?? 600;
    const pad = 40;
    const dim = scene.add.rectangle(0, 0, GAME_W * 2, GAME_H * 2, 0x05060a, 0.78).setInteractive();
    dim.on('pointerup', () => o.closeOnBackdrop && this.close());
    this.add(dim);

    const inner = scene.add.container(0, 0);
    this.add(inner);
    let y = pad;
    const title = txt(scene, 0, 0, o.title, 40, { font: 'title', color: o.titleColor ?? HEX.gold, wrap: width - pad * 2 });
    title.setPosition(0, y + title.height / 2);
    inner.add(title);
    y += title.height + 12;
    inner.add(scene.add.image(0, y, 'px').setTint(COLOR.gold).setAlpha(0.7).setDisplaySize(84, 3));
    y += 26;
    if (o.body) {
      const body = txt(scene, 0, 0, o.body, 25, { wrap: width - pad * 2, color: HEX.textDim, weight: 700, strokeThickness: 0 });
      body.setPosition(0, y + body.height / 2);
      inner.add(body);
      y += body.height + 24;
    }
    if (o.content) {
      const holder = scene.add.container(0, y);
      inner.add(holder);
      y += o.content(scene, holder, width) + 20;
    }
    const vertical = !!o.vertical;
    const n = o.buttons.length;
    const btnH = vertical ? 76 : 80;
    const gap = 16;
    const btnW = vertical
      ? Math.min(480, width - pad * 2)
      : n > 1 ? (width - pad * 2 - gap * (n - 1)) / n : Math.min(380, width - pad * 2);
    const rows = vertical ? n : 1;
    const total = y + rows * btnH + (rows - 1) * gap + pad;
    inner.addAt(scene.add.image(0, 0, shadowTexture(scene, width, total, 30, 26)).setAlpha(0.9), 0);
    const plate = scene.add.image(0, 0, plateTexture(scene, width, total, 1, 'panel', 30));
    inner.addAt(plate, 1);
    inner.each((ch: Phaser.GameObjects.GameObject) => {
      if ((ch as any) !== plate) (ch as any).y -= total / 2;
    });
    // тень и плита изначально в центре; подложка выше сдвигается вместе с остальными, поэтому вернём их
    (inner.list[0] as Phaser.GameObjects.Image).y = 10;
    plate.y = 0;
    o.buttons.forEach((b, i) => {
      const bw = b.w ?? btnW;
      const bx = vertical ? 0 : -((n - 1) * (btnW + gap)) / 2 + i * (btnW + gap);
      const by = (vertical ? y + btnH / 2 + i * (btnH + gap) : y + btnH / 2) - total / 2;
      const btn = new PlateButton(scene, bx, by, {
        w: bw, h: btnH, label: b.label, fontSize: 27, icon: b.icon, style: b.style ?? 'raised', radius: 22,
        onClick: () => {
          if (!b.keep) this.close();
          b.onClick?.();
        },
      });
      inner.add(btn);
      b.ref?.(btn);
    });
    pinToScreen(this);
    scene.add.existing(this);
    inner.setScale(0.9).setAlpha(0);
    dim.setAlpha(0);
    scene.tweens.add({ targets: inner, scaleX: 1, scaleY: 1, alpha: 1, duration: 220, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: dim, alpha: 0.78, duration: 200 });
    UiSound.play('open');
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    hideTip(this.scene);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 140,
      onComplete: () => this.destroy(),
    });
  }
}
