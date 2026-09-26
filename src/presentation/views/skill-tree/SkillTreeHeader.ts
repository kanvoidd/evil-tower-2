import type Phaser from 'phaser';

import type { SkillTreeCommand } from '../../../application/skill-tree/interfaces/SkillTreeCommand';
import type { SkillTreeQuery } from '../../../application/skill-tree/SkillTreeQuery';
import { t, type TKey } from '../../../i18n';
import {
  closeButton,
  CurrencyBar,
  fitText,
  icon,
  type IWalletSource,
  PlateButton,
  txt,
} from '../../components';
import { GAME_W, HEX } from '../../theme';

/**
 * Шапка дерева: герб класса (смена героя), имя класса и вложенные очки, валюта и крестик. Держится на экране, пока дерево панорамируется под ней.
 */
export class SkillTreeHeader {
  /** Размер и ширина названия класса: длинное название уменьшается, пока не поместится. */
  private static readonly NAME_SIZE = 32;
  private static readonly NAME_WIDTH = 210;

  /** Всё, что проявляется при входе (по порядку). */
  readonly items: Phaser.GameObjects.GameObject[];
  private readonly classBtn: PlateButton;
  private readonly name: Phaser.GameObjects.Text;
  private readonly spent: Phaser.GameObjects.Text;

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
    this.name = txt(scene, 128, 52, SkillTreeHeader.className(q), SkillTreeHeader.NAME_SIZE, {
      font: 'title',
      origin: [0, 0.5],
      color: HEX.gold,
      maxWidth: SkillTreeHeader.NAME_WIDTH,
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
    this.items = [this.classBtn, swap, this.name, this.spent, cur, close];
  }

  /** После покупки, метаморфозы или её отмены: герб и название класса, вложенные очки. */
  refresh(): void {
    this.classBtn.setIcon(`cls_${this.query.activeClass}`);
    this.name.setFontSize(SkillTreeHeader.NAME_SIZE).setText(SkillTreeHeader.className(this.query));
    fitText(this.name, SkillTreeHeader.NAME_WIDTH);
    this.spent.setText(t('skill.points', { n: this.query.spentPoints }));
  }

  private static className(q: SkillTreeQuery): string {
    return t(`class.${q.activeClass}.name` as TKey);
  }
}
