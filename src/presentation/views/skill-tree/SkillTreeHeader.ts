import type Phaser from 'phaser';

import type { SkillTreeCommand } from '../../../application/skill-tree/interfaces/SkillTreeCommand';
import type { SkillTreeQuery } from '../../../application/skill-tree/SkillTreeQuery';
import { t, type TKey } from '../../../i18n';
import {
  closeButton,
  CurrencyBar,
  icon,
  type IWalletSource,
  PlateButton,
  tipOnHover,
  txt,
} from '../../components';
import { GAME_W, HEX } from '../../theme';

/**
 * Шапка дерева: герб класса (смена героя), имя класса и вложенные очки, автопрокачка,
 * валюта и крестик. Держится на экране, пока дерево панорамируется под ней.
 */
export class SkillTreeHeader {
  /** Всё, что проявляется при входе (по порядку). */
  readonly items: Phaser.GameObjects.GameObject[];
  private readonly classBtn: PlateButton;
  private readonly spent: Phaser.GameObjects.Text;
  private readonly autoBtn: PlateButton;
  private readonly autoCap: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    private readonly query: SkillTreeQuery,
    wallet: IWalletSource,
    commands: (cmd: SkillTreeCommand) => void,
    onClose: () => void,
  ) {
    const q = query;
    scene.add
      .rectangle(GAME_W / 2, 66, GAME_W, 132, 0x0a0c12, 0.9)
      .setScrollFactor(0)
      .setDepth(700);
    scene.add
      .rectangle(GAME_W / 2, 132, GAME_W, 2, 0xffffff, 0.06)
      .setScrollFactor(0)
      .setDepth(700);
    this.classBtn = new PlateButton(scene, 66, 66, {
      w: 84,
      h: 84,
      icon: `cls_${q.activeClass}`,
      iconSize: 68,
      radius: 26,
      style: 'gold',
      onClick: () => commands({ type: 'switch-class' }),
    });
    this.classBtn.setScrollFactor(0).setDepth(710);
    const swap = scene.add
      .container(66 + 30, 66 + 30)
      .setScrollFactor(0)
      .setDepth(712);
    swap.add([
      scene.add.circle(0, 0, 15, 0x0b0d12).setStrokeStyle(2, 0xf0c75e),
      icon(scene, 0, 0, 'svgw_swap', 18),
    ]);
    const name = txt(scene, 128, 52, t(`class.${q.activeClass}.name` as TKey), 32, {
      font: 'title',
      origin: [0, 0.5],
      color: HEX.gold,
      maxWidth: 210,
      strokeThickness: 5,
    })
      .setScrollFactor(0)
      .setDepth(710);
    this.spent = txt(scene, 128, 84, t('skill.points', { n: q.spentPoints }), 17, {
      origin: [0, 0.5],
      color: HEX.textDim,
      weight: 800,
      strokeThickness: 0,
      maxWidth: 220,
    })
      .setScrollFactor(0)
      .setDepth(710);
    const cur = new CurrencyBar(scene, 590, 44, { wallet, compact: true })
      .setScrollFactor(0)
      .setDepth(710);
    const close = closeButton(scene, onClose).setScrollFactor(0).setDepth(710);
    this.items = [this.classBtn, swap, name, this.spent, cur, close];

    this.autoBtn = new PlateButton(scene, 384, 66, {
      w: 68,
      h: 68,
      icon: 'svg_auto',
      iconSize: 34,
      radius: 22,
      style: 'raised',
      onClick: () => commands({ type: 'toggle-auto' }),
    });
    this.autoBtn.iconImg?.setY(-10);
    this.autoCap = txt(scene, 0, 21, '', 15, { weight: 900, strokeThickness: 0 });
    this.autoBtn.pulseC.add(this.autoCap);
    this.autoBtn.setScrollFactor(0).setDepth(710).setVisible(q.tutorialDone);
    tipOnHover(
      scene,
      this.autoBtn,
      () => `${t('auto.skill.tip')}\n${t(q.autoSkillOn ? 'auto.state.on' : 'auto.state.off')}`,
    );
    this.paintAuto(q.autoSkillOn);
    this.items.push(this.autoBtn);
  }

  /** После покупки или отмены: герб класса и вложенные очки. */
  refresh(): void {
    this.classBtn.setIcon(`cls_${this.query.activeClass}`);
    this.spent.setText(t('skill.points', { n: this.query.spentPoints }));
  }

  /** Кнопка автопрокачки появляется после первого улучшения. */
  showAuto(): void {
    this.autoBtn.setVisible(true);
  }

  paintAuto(on: boolean): void {
    this.autoBtn.setStyle(on ? 'green' : 'raised');
    this.autoCap.setText(t(on ? 'auto.on' : 'auto.off')).setColor(on ? '#0f3b23' : HEX.textDim);
  }
}
