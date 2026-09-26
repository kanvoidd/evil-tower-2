import Phaser from 'phaser';

import { isSynergy, TALENT_PLACE_BY_ID, type TalentPath } from '../../../domain/catalog';
import type { NodeState, TreeNode } from '../../../domain/progression';
import { icon, plateTexture, txt } from '../../components';
import { HEX, pathHex } from '../../theme';

/**
 * Узел дерева на экране: плитка, свечение, значок пути у таланта, рамка максимального ранга
 * и счётчик рангов «2/3». Нажатие на плитку выбирает узел.
 */
export class NodeView {
  static readonly SIZE = { talent: 108, perk: 118, cls: 150, evo: 96 } as const;
  private static readonly PATH_ICON: Record<TalentPath, string> = {
    attack: 'svg_sword',
    vitality: 'svg_health',
    guard: 'svg_defense',
  };

  readonly size: number;
  private readonly main: Phaser.GameObjects.Image;
  private readonly glow: Phaser.GameObjects.Image;
  private readonly ico?: Phaser.GameObjects.Image;
  private readonly maxFrame?: Phaser.GameObjects.Image;
  private readonly badge?: Phaser.GameObjects.Container;
  private readonly badgeText?: Phaser.GameObjects.Text;
  /** Последняя отрисовка рангов — чтобы вернуть значки после смены вкладки. */
  private ranks = { dim: false, rank: 0, max: 1 };

  /** `texture` — плитка узла: талант пути, значок способности, герб класса или врата. */
  constructor(
    scene: Phaser.Scene,
    readonly node: TreeNode,
    readonly x: number,
    readonly y: number,
    texture: string,
    onTap: () => void,
  ) {
    const n = node;
    const S = NodeView.SIZE;
    this.size =
      n.kind === 'talent'
        ? S.talent
        : n.kind === 'perk'
          ? S.perk
          : n.kind === 'class'
            ? S.cls
            : S.evo;
    const size = this.size;
    this.glow = scene.add
      .image(x, y, 'glow')
      .setTint(NodeView.colorOf(n))
      .setDisplaySize(size * 2.4, size * 2.4)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(2)
      .setAlpha(0);
    this.main = scene.add.image(x, y, texture).setDisplaySize(size, size).setDepth(5);
    if (n.kind === 'talent' || (n.ranks ?? 1) > 1) {
      if (n.kind === 'talent')
        this.ico = icon(scene, x, y - 4, NodeView.talentIcon(n), size * 0.44).setDepth(6);
      this.maxFrame = scene.add
        .image(x, y, 'tal_max')
        .setDisplaySize(size, size)
        .setDepth(7)
        .setVisible(false);
      // счётчик рангов (уровней перка) в углу плитки — «2/3»
      const badge = scene.add.container(x + size * 0.3, y + size * 0.32).setDepth(8);
      badge.add(scene.add.image(0, 0, plateTexture(scene, 54, 30, 1, 'dark', 15)));
      const bt = txt(scene, 0, -1, '', 17, { weight: 900, strokeThickness: 0 });
      badge.add(bt);
      this.badge = badge;
      this.badgeText = bt;
    }
    this.main.setInteractive({ useHandCursor: true });
    this.main.on('pointerup', onTap);
  }

  /** Цвет узла: у таланта — цвет его пути, у остальных — золото. */
  static colorOf(n: TreeNode): number {
    if (n.kind === 'talent') return pathHex(n.path!);
    return 0xffd86b;
  }

  /** Значок таланта: у синергий — молния (они меняют способности), у остальных — символ пути. */
  static talentIcon(n: TreeNode): string {
    return isSynergy(TALENT_PLACE_BY_ID[n.talentId!].talent.effect)
      ? 'svg_bolt'
      : NodeView.PATH_ICON[n.path!];
  }

  /**
   * Состояние узла: закрытые приглушены, купленные светятся; у таланта и перка с уровнями —
   * счётчик рангов.
   */
  paint(st: NodeState, rank: number, max: number): void {
    const n = this.node;
    const dim = st === 'locked' || st === 'blocked';
    let tint = 0xffffff;
    if (dim) tint = st === 'blocked' ? 0x4a3030 : 0x3a3d4a;
    if (tint === 0xffffff) this.main.clearTint();
    else this.main.setTint(tint);
    this.ico?.setAlpha(dim ? 0.3 : 1);
    this.glow.setAlpha(st === 'owned' ? 0.7 : st === 'partial' ? 0.45 : 0);
    this.main.setAlpha(n.kind === 'class' && dim ? 0.7 : 1);
    this.ranks = { dim, rank, max };
    if (this.badge) this.paintBadge();
  }

  /** Ранги таланта или уровни перка: рамка максимума, значок «ранг/максимум» и его цвет. */
  private paintBadge(): void {
    const { dim, rank, max } = this.ranks;
    if (!this.main.visible) return;
    this.maxFrame?.setVisible(rank >= max);
    this.badge?.setVisible(!dim || rank > 0);
    this.badgeText?.setText(`${rank}/${max}`);
    this.badgeText?.setColor(rank >= max ? HEX.gold : rank > 0 ? HEX.text : HEX.textMute);
  }

  /** Узел на текущей вкладке дерева виден, на другой — спрятан. */
  setVisible(on: boolean): void {
    for (const o of [this.main, this.glow, this.ico, this.maxFrame, this.badge]) o?.setVisible(on);
    if (on) this.paintBadge();
  }

  /** «Дыхание» свечения у узлов, которые можно купить. */
  setGlow(alpha: number): void {
    this.glow.setAlpha(alpha);
  }
}
