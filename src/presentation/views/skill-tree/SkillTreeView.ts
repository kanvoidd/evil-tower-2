import Phaser from 'phaser';

import type { ISkillTreeView } from '../../../application/skill-tree/interfaces/ISkillTreeView';
import type { AutoSkillPlan, NodeState, Tree, TreeNode } from '../../../domain/progression';
import type { ClassId } from '../../../domain/types';
import { t } from '../../../i18n';
import {
  background,
  PanController,
  staggerIn,
  tapHint,
  toast,
  txt,
  UiSound,
} from '../../components';
import { zoomIn } from '../../navigation/SceneTransitions';
import { pathHex } from '../../textures/Textures';
import { GAME_H, GAME_W, HEX } from '../../theme';
import { EdgeView } from './EdgeView';
import type { SkillTreeViewDeps } from './interfaces/SkillTreeViewDeps';
import { NodeView } from './NodeView';
import { SkillInfoPanel } from './SkillInfoPanel';
import { SkillTreeHeader } from './SkillTreeHeader';

/**
 * Дерево навыков на экране: узлы и связи на «холсте», который панорамируется пальцем, шапка
 * и панель выбранного узла. Выбор узла, подсветка и эффекты — дело экрана; покупки и
 * метаморфозы экран отдаёт командами и показывает их итог.
 */
export class SkillTreeView implements ISkillTreeView {
  /** Масштаб дерева на экране и отступ сверху (под шапку). */
  private static readonly K = 0.62;
  private static readonly OFFSET_Y = 260;

  private readonly tree: Tree;
  private readonly nodes = new Map<string, NodeView>();
  private readonly edges: EdgeView[] = [];
  private readonly states = new Map<string, NodeState>();
  private readonly pan: PanController;
  private readonly ring: Phaser.GameObjects.Image;
  private readonly header: SkillTreeHeader;
  private readonly panel: SkillInfoPanel;
  private selected: TreeNode | null = null;
  private hint: Phaser.GameObjects.GameObject[] = [];
  /** Игрок уходит из дерева — узлы больше не выбираются. */
  private leaving = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly d: SkillTreeViewDeps,
  ) {
    const K = SkillTreeView.K;
    this.tree = d.query.tree;
    background(scene);

    this.buildWorld();
    const b = this.tree.bounds;
    const bounds = {
      minX: b.minX * K - 220,
      maxX: b.maxX * K + 220,
      minY: 0,
      maxY: b.maxY * K + SkillTreeView.OFFSET_Y + 300,
    };
    this.pan = new PanController(
      scene,
      bounds,
      new Phaser.Geom.Rectangle(0, 140, GAME_W, GAME_H - 140 - SkillInfoPanel.H),
      'xy',
    );
    this.ring = scene.add.image(0, 0, 'ring').setDepth(30).setVisible(false);
    scene.tweens.add({
      targets: this.ring,
      alpha: { from: 1, to: 0.45 },
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.header = new SkillTreeHeader(scene, d.query, d.wallet, d.commands, () => this.close());
    this.panel = new SkillInfoPanel(scene, d.query, d.commands);
    this.refresh();

    const last = d.query.lastNode;
    const lv = this.nodes.get(last.id)!;
    this.pan.setCenter(lv.x, lv.y + 90);
    this.select(this.pickInitialSelection(last));
    this.setupTutorial();

    scene.input.keyboard?.on('keydown-ESC', () => this.close());
    zoomIn(scene);
    staggerIn(scene, this.header.items, { dy: -26, delay: 200, gap: 50 });
    staggerIn(scene, [this.panel.root], { dy: 90, delay: 320, gap: 0, ms: 440 });
  }

  /** Каждый кадр: инерция панорамирования и «дыхание» доступных узлов. */
  update(dt: number): void {
    this.pan.update(dt);
    const pulse = 0.42 + 0.2 * Math.sin(this.scene.time.now / 620);
    for (const [id, v] of this.nodes) {
      const st = this.states.get(id);
      if (st === 'available' || st === 'partial') v.setGlow(pulse);
    }
  }

  refused(reason: 'state' | 'souls'): void {
    UiSound.play('error');
    if (reason === 'souls') toast(this.scene, t('skill.no_souls'), 'ico_soul');
  }

  learned(node: TreeNode): void {
    this.header.showAuto();
    if (node.kind === 'class') {
      this.scene.cameras.main.flash(300, 255, 220, 120);
      UiSound.play('reward');
    } else {
      UiSound.play(node.kind === 'perk' || this.d.query.maxed(node) ? 'reward' : 'upgrade');
    }
    this.refresh();
    this.header.refresh();
    const v = this.nodes.get(node.id)!;
    this.burst(v.x, v.y, NodeView.colorOf(node));
    this.showInfo(node);
    this.clearHint();
    if (node.kind !== 'talent') toast(this.scene, t('toast.reward'), 'svg_trophy');
  }

  metamorphosisCancelled(to: ClassId): void {
    UiSound.play('break');
    this.refresh();
    this.header.refresh();
    this.select(this.tree.classNode[to]);
  }

  autoBought(plan: AutoSkillPlan): void {
    this.refresh();
    this.header.refresh();
    const last = plan.buys[plan.buys.length - 1];
    const v = this.nodes.get(last.id);
    if (v) {
      this.burst(v.x, v.y, NodeView.colorOf(last));
      this.pan.setCenter(v.x, v.y + 90);
    }
    UiSound.play('upgrade');
    if (this.selected) this.showInfo(this.selected);
    toast(this.scene, t('auto.skill.result', { n: plan.buys.length }), 'ico_soul');
  }

  autoToggled(on: boolean, plan: AutoSkillPlan | null): void {
    this.header.paintAuto(on);
    UiSound.play('click');
    if (!on) {
      toast(this.scene, t('auto.skill.disabled'), 'svg_auto');
      return;
    }
    if (plan?.buys.length) this.autoBought(plan);
    else
      toast(
        this.scene,
        t(
          plan?.stop === 'meta'
            ? 'auto.skill.meta'
            : plan?.stop === 'done'
              ? 'auto.skill.done'
              : 'auto.skill.enabled',
        ),
        'svg_auto',
      );
  }

  // ------------------------------------------------------------------------------ мир

  private wx(n: TreeNode): number {
    return n.x * SkillTreeView.K;
  }

  private wy(n: TreeNode): number {
    return n.y * SkillTreeView.K + SkillTreeView.OFFSET_Y;
  }

  private buildWorld(): void {
    const tree = this.tree;
    for (const [a, b] of tree.edges) {
      const na = tree.byId.get(a)!;
      const nb = tree.byId.get(b)!;
      const talent = nb.kind === 'talent' ? nb : na.kind === 'talent' ? na : null;
      this.edges.push(
        new EdgeView(
          this.scene,
          a,
          b,
          { x: this.wx(na), y: this.wy(na) },
          { x: this.wx(nb), y: this.wy(nb) },
          talent ? pathHex(talent.path!) : 0xf5c518,
        ),
      );
    }
    for (const n of tree.nodes) {
      const view = new NodeView(this.scene, n, this.wx(n), this.wy(n), this.textureOf(n), () => {
        if (this.pan.dragging || this.leaving) return;
        this.select(n);
      });
      this.nodes.set(n.id, view);
    }
  }

  private textureOf(n: TreeNode): string {
    if (n.kind === 'talent') return `tal_${n.path}`;
    if (n.kind === 'perk') return this.d.query.perk(n)?.icon ?? 'evo_gate';
    if (n.kind === 'class') return `cls_${n.classId}`;
    return 'evo_gate';
  }

  private refresh(): void {
    const q = this.d.query;
    for (const n of this.tree.nodes) this.states.set(n.id, q.state(n));
    for (const [id, v] of this.nodes)
      v.paint(this.states.get(id)!, q.rank(v.node), q.maxRank(v.node));
    for (const e of this.edges) e.paint(this.states.get(e.a)!, this.states.get(e.b)!);
  }

  // ------------------------------------------------------------------------------ выбор узла

  private select(n: TreeNode | null): void {
    this.panel.clear();
    this.selected = n;
    if (!n) {
      this.ring.setVisible(false);
      return;
    }
    const v = this.nodes.get(n.id)!;
    this.ring
      .setVisible(true)
      .setPosition(v.x, v.y)
      .setDisplaySize(v.size + 24, v.size + 24);
    UiSound.play('click');
    this.showInfo(n);
    this.clearHint();
  }

  private showInfo(n: TreeNode): void {
    this.panel.show(n, this.states.get(n.id) ?? this.d.query.state(n));
  }

  /** Ближайший к последней покупке узел, который можно купить (или сама последняя покупка). */
  private pickInitialSelection(last: TreeNode): TreeNode {
    let best: TreeNode | null = null;
    let bestD = Infinity;
    const lv = this.nodes.get(last.id)!;
    for (const [id, v] of this.nodes) {
      const st = this.states.get(id);
      if (st !== 'available' && st !== 'partial') continue;
      const d = Math.hypot(v.x - lv.x, v.y - lv.y);
      if (d < bestD) {
        bestD = d;
        best = v.node;
      }
    }
    return best ?? last;
  }

  // ------------------------------------------------------------------------------ эффекты и обучение

  private burst(x: number, y: number, color: number): void {
    const s = this.scene;
    const ring = s.add.image(x, y, 'ring').setTint(color).setDepth(40).setDisplaySize(40, 40);
    s.tweens.add({
      targets: ring,
      displayWidth: 240,
      displayHeight: 240,
      alpha: 0,
      duration: 500,
      onComplete: () => ring.destroy(),
    });
    for (let i = 0; i < 14; i++) {
      // мягкие точки света, а не звёздочки — «сюрикенов» в игре нет нигде
      const dot = s.add
        .image(x, y, 'dot')
        .setTint(color)
        .setDepth(40)
        .setDisplaySize(14, 14)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(0.7 + Math.random() * 0.8);
      const a = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 90;
      s.tweens.add({
        targets: dot,
        x: x + Math.cos(a) * dist,
        y: y + Math.sin(a) * dist,
        alpha: 0,
        duration: 550,
        onComplete: () => dot.destroy(),
      });
    }
  }

  /** Обучение: самый дешёвый узел, который уже по карману, — выбран, и к нему тянется «палец». */
  private setupTutorial(): void {
    const target = this.d.query.tutorialTarget();
    if (!target) return;
    const v = this.nodes.get(target.id)!;
    this.select(target);
    this.pan.setCenter(v.x, v.y + 90);
    const text = txt(this.scene, GAME_W / 2, 176, t('tut.skill_buy'), 26, {
      color: HEX.gold,
      wrap: 640,
    })
      .setScrollFactor(0)
      .setDepth(720);
    const hand = tapHint(this.scene, v.x, v.y + 36);
    this.hint.push(text, hand);
  }

  private clearHint(): void {
    this.hint.forEach((h) => h.destroy());
    this.hint = [];
  }

  private close(): void {
    this.leaving = true;
    this.d.commands({ type: 'close' });
  }
}
