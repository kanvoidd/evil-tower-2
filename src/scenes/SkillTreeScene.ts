import Phaser from 'phaser';
import type { ChainKind, ClassId, LineageSave } from '../types';
import { CLASSES } from '../data/classes';
import { NODE_VALUE } from '../data/economy';
import { PERK_BY_ID } from '../data/perks';
import { GAME_H, GAME_W, GAMEPLAY, HEX } from '../config';
import { AUDIO } from '../systems/Audio';
import { Store } from '../systems/Store';
import { describeTrait, fmt, perkDesc, perkName, t } from '../i18n';
import type { TKey } from '../i18n';
import {
  applyBuy, applyCancelMetamorphosis, canBuy, canCancelMetamorphosis, costOf, nodeState, perkIdOfNode, TREES,
  type NodeState, type Tree, type TreeNode,
} from '../logic/skillTree';
import type { AutoSkillPlan } from '../logic/autoSkill';
import { classTraits } from '../logic/traits';
import { STAT_COLOR, statHex } from '../ui/Textures';
import {
  background, bindToasts, closeButton, CurrencyBar, Dialog, fadeToScene, fitHeight, icon, leaveMenu, PanController, PlateButton,
  pinToScreen, plateTexture, shadowTexture, staggerIn, tapHint, tipOnHover, toast, txt, zoomIn,
} from '../ui/Kit';

const K = 0.8;
const OFFSET_Y = 300;
const CHAIN_COLOR: Record<ChainKind, number> = { damage: statHex('damage'), health: statHex('health'), defense: statHex('defense') };
const SIZE = { stat: 62, perk: 116, cls: 156, evo: 104 };
const PANEL_H = 300;

interface NodeView {
  node: TreeNode;
  x: number;
  y: number;
  size: number;
  main: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
  ico?: Phaser.GameObjects.Image;
  lock?: Phaser.GameObjects.Image;
}

interface EdgeView {
  img: Phaser.GameObjects.Image;
  a: number;
  b: number;
  color: number;
}

export class SkillTreeScene extends Phaser.Scene {
  private tree!: Tree;
  private ls!: LineageSave;
  private views = new Map<number, NodeView>();
  private edges: EdgeView[] = [];
  private states = new Map<number, NodeState>();
  private pan!: PanController;
  private ring!: Phaser.GameObjects.Image;
  private closing = false;
  private pulse = 0;
  private panel!: Phaser.GameObjects.Container;
  private classBtn!: PlateButton;
  private autoBtn?: PlateButton;
  private autoCap?: Phaser.GameObjects.Text;
  private headerItems: Phaser.GameObjects.GameObject[] = [];
  private selected: TreeNode | null = null;
  private hint: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('SkillTree');
  }

  init(): void {
    this.views = new Map();
    this.edges = [];
    this.states = new Map();
    this.closing = false;
    this.hint = [];
    this.selected = null;
    this.autoBtn = undefined;
    this.autoCap = undefined;
    this.headerItems = [];
  }

  create(): void {
    this.tree = TREES[Store.activeLineage];
    // Автопрокачка (если включена) тратит накопленные души до того, как дерево нарисовано.
    const auto = Store.runAutoSkill();
    this.ls = Store.activeLineageSave;
    background(this);
    bindToasts(this);

    this.buildWorld();
    const b = this.tree.bounds;
    const bounds = {
      minX: b.minX * K - 150,
      maxX: b.maxX * K + 150,
      minY: 0,
      maxY: b.maxY * K + OFFSET_Y + 320,
    };
    this.pan = new PanController(this, bounds, new Phaser.Geom.Rectangle(0, 140, GAME_W, GAME_H - 140 - PANEL_H), 'xy');
    this.ring = this.add.image(0, 0, 'ring').setDepth(30).setVisible(false);
    this.tweens.add({ targets: this.ring, alpha: { from: 1, to: 0.45 }, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.buildTop();
    this.buildPanel();
    this.refresh();

    // Камера — на последнем изученном улучшении, а не в начале дерева.
    const last = this.tree.byId.get(this.ls.last) ?? this.tree.classNode[this.tree.base]!;
    const lv = this.views.get(last.id)!;
    this.pan.setCenter(lv.x, lv.y + 90);
    this.select(this.pickInitialSelection(last));
    this.setupTutorial();

    this.input.keyboard?.on('keydown-ESC', () => this.close());
    // вход: дерево проявляется из «окна» кнопки, шапка опускается сверху, панель узла поднимается снизу
    zoomIn(this);
    staggerIn(this, this.headerItems, { dy: -26, delay: 200, gap: 50 });
    staggerIn(this, [this.panel], { dy: 90, delay: 320, gap: 0, ms: 440 });
    // при открытии дерева сообщаем только о реальных покупках (без напоминаний «жду метаморфозу» каждый раз)
    if (auto?.buys.length) this.time.delayedCall(650, () => this.announceAuto(auto));
  }

  private wx(n: TreeNode): number {
    return n.x * K;
  }

  private wy(n: TreeNode): number {
    return n.y * K + OFFSET_Y;
  }

  // ------------------------------------------------------------------------------ мир

  private buildWorld(): void {
    const tree = this.tree;
    // рёбра
    for (const [a, b] of tree.edges) {
      const na = tree.byId.get(a)!;
      const nb = tree.byId.get(b)!;
      const ax = this.wx(na);
      const ay = this.wy(na);
      const bx = this.wx(nb);
      const by = this.wy(nb);
      const len = Math.hypot(bx - ax, by - ay);
      const img = this.add.image(ax, ay, 'px').setOrigin(0, 0.5).setDepth(1);
      img.setRotation(Math.atan2(by - ay, bx - ax));
      const heavy = na.kind !== 'stat' || nb.kind !== 'stat';
      img.setDisplaySize(len, heavy ? 8 : 5);
      const chain = nb.chain ?? na.chain;
      this.edges.push({ img, a, b, color: chain ? CHAIN_COLOR[chain] : 0xf5c518 });
    }
    // узлы
    for (const n of tree.nodes) {
      const x = this.wx(n);
      const y = this.wy(n);
      let key = '';
      let size = SIZE.stat;
      if (n.kind === 'stat') key = `orb_${n.stat}`;
      else if (n.kind === 'perk') {
        key = PERK_BY_ID[perkIdOfNode(n)].icon;
        size = SIZE.perk;
      } else if (n.kind === 'class') {
        key = `cls_${n.classId}`;
        size = SIZE.cls;
      } else {
        key = 'evo_gate';
        size = SIZE.evo;
      }
      const glowCol = n.kind === 'stat' ? Phaser.Display.Color.HexStringToColor(STAT_COLOR[n.stat!]).color : 0xffd86b;
      const glow = this.add.image(x, y, 'glow').setTint(glowCol).setDisplaySize(size * 2.4, size * 2.4).setBlendMode(Phaser.BlendModes.ADD).setDepth(2).setAlpha(0);
      const main = this.add.image(x, y, key).setDisplaySize(size, size).setDepth(n.kind === 'stat' ? 3 : 5);
      let ico: Phaser.GameObjects.Image | undefined;
      if (n.kind === 'stat') {
        ico = icon(this, x, y, `svg_${n.stat}`, size * 0.55).setDepth(4);
        if (n.alt) this.add.image(x, y, 'ring').setDisplaySize(size + 12, size + 12).setTint(0xffd86b).setAlpha(0.65).setDepth(3);
      }
      main.setInteractive({ useHandCursor: true });
      main.on('pointerup', () => {
        if (this.pan.dragging || this.closing) return;
        this.select(n);
      });
      this.views.set(n.id, { node: n, x, y, size, main, glow, ico });
    }
  }

  private refresh(): void {
    this.ls = Store.activeLineageSave;
    const active = Store.activeClass;
    for (const n of this.tree.nodes) this.states.set(n.id, nodeState(this.tree, this.ls, n));
    for (const [id, v] of this.views) {
      const st = this.states.get(id)!;
      const n = v.node;
      const dim = st === 'locked' || st === 'blocked';
      let tint = 0xffffff;
      if (dim) tint = st === 'blocked' ? 0x4a3030 : 0x3a3d4a;
      if (n.kind === 'perk' && st === 'owned' && n.owner !== active) tint = 0x8a8fa8;
      if (tint === 0xffffff) v.main.clearTint();
      else v.main.setTint(tint);
      v.ico?.setAlpha(dim ? 0.3 : 1);
      v.glow.setAlpha(st === 'owned' ? 0.75 : 0);
      if (n.kind === 'class' && dim) v.main.setAlpha(0.7);
      else v.main.setAlpha(1);
    }
    for (const e of this.edges) {
      const sa = this.states.get(e.a)!;
      const sb = this.states.get(e.b)!;
      if (sa === 'owned' && sb === 'owned') e.img.setTint(e.color).setAlpha(0.95);
      else if (sa === 'owned' && sb === 'available') e.img.setTint(0x9aa2c4).setAlpha(0.8);
      else e.img.setTint(0x2b3148).setAlpha(0.85);
    }
  }

  update(_t: number, dt: number): void {
    this.pan.update(dt);
    this.pulse = 0.42 + 0.2 * Math.sin(this.time.now / 620);
    for (const [id, v] of this.views) {
      if (this.states.get(id) === 'available') v.glow.setAlpha(this.pulse);
    }
  }

  // ------------------------------------------------------------------------------ верхняя панель

  private buildTop(): void {
    // затемнённая шапка: узлы, уехавшие под неё, не спорят с кнопками
    this.add.rectangle(GAME_W / 2, 66, GAME_W, 132, 0x0a0c12, 0.9).setScrollFactor(0).setDepth(700);
    this.add.rectangle(GAME_W / 2, 132, GAME_W, 2, 0xffffff, 0.06).setScrollFactor(0).setDepth(700);
    this.classBtn = new PlateButton(this, 66, 66, {
      w: 84, h: 84, icon: `cls_${Store.activeClass}`, iconSize: 68, radius: 26, style: 'gold',
      onClick: () => fadeToScene(this, 'ClassSelect', { mode: 'switch', from: 'SkillTree' }),
    });
    this.classBtn.setScrollFactor(0).setDepth(710);
    // значок «сменить класс» в углу кнопки
    const swap = this.add.container(66 + 30, 66 + 30).setScrollFactor(0).setDepth(712);
    swap.add([this.add.circle(0, 0, 15, 0x0b0d12).setStrokeStyle(2, 0xf0c75e), icon(this, 0, 0, 'svgw_swap', 18)]);
    const name = txt(this, 128, 66, t(`class.${Store.activeClass}.name` as TKey), 34, { font: 'title', origin: [0, 0.5], color: HEX.gold, maxWidth: 210, strokeThickness: 5 })
      .setScrollFactor(0).setDepth(710);
    const cur = new CurrencyBar(this, 590, 44, { compact: true }).setScrollFactor(0).setDepth(710);
    const close = closeButton(this, () => this.close()).setScrollFactor(0).setDepth(710);
    this.headerItems = [this.classBtn, swap, name, cur, close];

    // автопрокачка: одна кнопка «вкл/выкл» (без окон и настроек). Появляется после первого улучшения — не мешает обучению.
    this.autoBtn = new PlateButton(this, 384, 66, {
      w: 68, h: 68, icon: 'svg_auto', iconSize: 34, radius: 22, style: 'raised', onClick: () => this.toggleAuto(),
    });
    this.autoBtn.iconImg?.setY(-10);
    this.autoCap = txt(this, 0, 21, '', 15, { weight: 900, strokeThickness: 0 });
    this.autoBtn.pulseC.add(this.autoCap);
    this.autoBtn.setScrollFactor(0).setDepth(710).setVisible(Store.data.tutorial.skill);
    tipOnHover(this, this.autoBtn, () => `${t('auto.skill.tip')}\n${t(Store.autoSkillCfg().on ? 'auto.state.on' : 'auto.state.off')}`);
    this.refreshAutoBtn();
    this.headerItems.push(this.autoBtn);
  }

  private refreshAutoBtn(): void {
    const on = Store.autoSkillCfg().on;
    this.autoBtn?.setStyle(on ? 'green' : 'raised');
    this.autoCap?.setText(t(on ? 'auto.on' : 'auto.off')).setColor(on ? '#0f3b23' : HEX.textDim);
  }

  /** Нажатие на кнопку автопрокачки: включает/выключает; при включении сразу идёт вниз по ветке последнего улучшения. */
  private toggleAuto(): void {
    const cfg = Store.toggleAutoSkill();
    this.refreshAutoBtn();
    AUDIO.play('click');
    if (!cfg.on) {
      toast(this, t('auto.skill.disabled'), 'svg_auto');
      return;
    }
    const plan = Store.runAutoSkill();
    if (plan?.buys.length) this.announceAuto(plan);
    else toast(this, t(plan?.stop === 'meta' ? 'auto.skill.meta' : plan?.stop === 'done' ? 'auto.skill.done' : 'auto.skill.enabled'), 'svg_auto');
  }

  private announceAuto(plan: AutoSkillPlan): void {
    if (plan.buys.length) {
      Store.save();
      this.refresh();
      this.refreshTop();
      const last = plan.buys[plan.buys.length - 1];
      const v = this.views.get(last.id);
      if (v) {
        this.burst(v.x, v.y, last.kind === 'stat' ? statHex(last.stat!) : 0xffd86b);
        this.pan.setCenter(v.x, v.y + 90);
      }
      AUDIO.play('upgrade');
      if (this.selected) this.showInfo(this.selected);
      toast(this, t('auto.skill.result', { n: plan.buys.length }), 'ico_soul');
    } else if (plan.stop === 'meta') {
      toast(this, t('auto.skill.meta'), 'svg_auto');
    } else if (plan.stop === 'done') {
      toast(this, t('auto.skill.done'), 'svg_check');
    }
  }

  private refreshTop(): void {
    this.classBtn.setIcon(`cls_${Store.activeClass}`);
  }

  // ------------------------------------------------------------------------------ нижняя панель

  private buildPanel(): void {
    this.panel = this.add.container(0, 0).setScrollFactor(0).setDepth(800);
  }

  private nodeTitle(n: TreeNode): { title: string; sub: string; desc: string; tex: string; extra?: string } {
    if (n.kind === 'stat') {
      return {
        title: t(`stat.${n.stat}` as TKey),
        sub: t('skill.tier', { n: n.tier! }),
        desc: t(`node.${n.stat}` as TKey, { v: NODE_VALUE[n.stat!] }),
        tex: `orb_${n.stat}`,
      };
    }
    if (n.kind === 'perk') {
      const perk = PERK_BY_ID[perkIdOfNode(n)];
      const slot = (['skill.perk_start', 'skill.perk_p2', 'skill.perk_p3', 'skill.perk_legend'] as TKey[])[n.seg!];
      return { title: perkName(perk), sub: t(slot), desc: perkDesc(perk), tex: perk.icon };
    }
    if (n.kind === 'class') {
      return {
        title: t(`class.${n.classId}.name` as TKey),
        sub: t('skill.class'),
        // краткая сводка: что даёт класс (до трёх строк)
        desc: classTraits(n.classId!, 3).map((tr) => `• ${describeTrait(tr)}`).join('\n'),
        tex: `cls_${n.classId}`,
      };
    }
    return { title: t('skill.evo'), sub: '', desc: t('skill.evo_desc'), tex: 'evo_gate' };
  }

  private select(n: TreeNode | null): void {
    this.panel.removeAll(true);
    this.selected = n;
    if (!n) {
      this.ring.setVisible(false);
      return;
    }
    const v = this.views.get(n.id)!;
    this.ring.setVisible(true).setPosition(v.x, v.y).setDisplaySize(v.size + 22, v.size + 22);
    AUDIO.play('click');
    this.showInfo(n);
    this.clearHint();
  }

  private showInfo(n: TreeNode): void {
    const p = this.panel;
    p.removeAll(true);
    const st = this.states.get(n.id) ?? nodeState(this.tree, this.ls, n);
    const info = this.nodeTitle(n);
    const y0 = GAME_H - PANEL_H;
    const pw = GAME_W - 16;
    p.add(this.add.image(GAME_W / 2, y0 + PANEL_H / 2 - 4, shadowTexture(this, pw, PANEL_H, 34, 24)).setAlpha(0.9));
    p.add(this.add.image(GAME_W / 2, y0 + PANEL_H / 2 + 2, plateTexture(this, pw, PANEL_H, 1, 'panel', 34)));
    p.add(this.add.image(84, y0 + 86, plateTexture(this, 108, 108, 1, 'dark', 26)));
    p.add(this.add.image(84, y0 + 86, info.tex).setDisplaySize(84, 84));
    if (n.kind === 'stat') p.add(icon(this, 84, y0 + 86, `svg_${n.stat}`, 46));
    p.add(txt(this, 158, y0 + 50, info.title, 34, { font: 'title', origin: [0, 0.5], maxWidth: 520, color: HEX.gold, strokeThickness: 0 }));
    if (info.sub) p.add(txt(this, 158, y0 + 88, info.sub, 20, { origin: [0, 0.5], color: HEX.textMute, weight: 800, strokeThickness: 0 }));
    let desc = info.desc;
    if (n.kind === 'perk' && n.owner !== Store.activeClass && n.seg! > 0) {
      desc += `\n${t('skill.inactive', { c: t(`class.${n.owner}.name` as TKey) })}`;
    }
    const descText = txt(this, 158, y0 + 112, desc, 22, { origin: [0, 0], wrap: 520, weight: 700, strokeThickness: 0, lineSpacing: 0, align: 'left' });
    fitHeight(descText, 92, 14);
    p.add(descText);
    // пометка о развилке — под описанием, по левому краю (в нижней строке ей тесно рядом с кнопкой)
    if (st === 'available' && n.excl !== undefined) {
      const note = txt(this, 158, y0 + 112 + descText.height + 4, t('skill.fork'), 18, {
        origin: [0, 0], wrap: 520, color: HEX.textDim, weight: 700, strokeThickness: 0, lineSpacing: 0, align: 'left',
      });
      p.add(note);
    }

    // нижняя строка: цена слева, кнопка или статус справа
    const cost = costOf(n);
    const rowY = GAME_H - 58;
    let btn: PlateButton | null = null;
    let status = '';
    let statusColor: string = HEX.textDim;

    if (n.kind === 'class' && st === 'owned' && canCancelMetamorphosis(this.tree, this.ls, n.classId!)) {
      btn = new PlateButton(this, GAME_W - 200, rowY, {
        w: 340, h: 72, label: t('skill.cancel_meta'), fontSize: 22, style: 'red', radius: 24, onClick: () => this.confirmCancel(n),
      });
    } else if (st === 'owned') {
      status = n.kind === 'perk' && n.seg! > 0 && n.owner !== Store.activeClass ? t('skill.lost') : t('skill.owned');
      statusColor = HEX.good;
    } else if (st === 'available') {
      const can = Store.souls >= cost;
      btn = new PlateButton(this, GAME_W - 190, rowY, {
        w: 320, h: 72, label: t('skill.buy'), fontSize: 32, style: 'gold', radius: 24, icon: 'ico_soul', iconSize: 34,
        onClick: () => this.tryBuy(n),
      });
      btn.setLocked(!can);
    } else if (st === 'blocked') {
      status = n.kind === 'perk' ? t('skill.lost') : t('skill.blocked');
      statusColor = HEX.bad;
    } else {
      status = t('skill.locked');
    }
    if (cost > 0 && st !== 'owned') {
      p.add(this.add.image(58, rowY, 'ico_soul').setDisplaySize(38, 38));
      p.add(txt(this, 86, rowY, fmt(cost), 32, { origin: [0, 0.5], weight: 900, color: Store.souls >= cost ? HEX.soul : HEX.bad }));
    }
    if (status) {
      // статус выровнен по левому краю: сразу после цены, а если цены нет — от левого края панели
      const sx = cost > 0 && st !== 'owned' ? 210 : 58;
      p.add(txt(this, sx, rowY, status, 21, {
        origin: [0, 0.5], align: 'left', wrap: GAME_W - 32 - sx, color: statusColor, weight: 700, strokeThickness: 0,
      }));
    }
    if (btn) p.add(btn);
    pinToScreen(p);
  }

  // ------------------------------------------------------------------------------ покупка и метаморфоза

  private tryBuy(n: TreeNode): void {
    const r = canBuy(this.tree, this.ls, n, Store.souls);
    if (!r.ok) {
      AUDIO.play('error');
      if (r.reason === 'souls') toast(this, t('skill.no_souls'), 'ico_soul');
      return;
    }
    if (n.kind === 'class') {
      this.confirmMetamorphosis(n, r.cost);
      return;
    }
    this.commit(n, r.cost);
  }

  private classArrow(scene: Phaser.Scene, c: Phaser.GameObjects.Container, from: ClassId, to: ClassId): number {
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

  private confirmMetamorphosis(n: TreeNode, cost: number): void {
    const to = n.classId!;
    const from = CLASSES[to].parent!;
    new Dialog(this, {
      title: t('meta.title'),
      body: t('meta.body'),
      content: (s, c) => this.classArrow(s, c, from, to),
      buttons: [
        { label: t('common.cancel') },
        { label: t('common.continue'), style: 'gold', onClick: () => this.commit(n, cost) },
      ],
    });
  }

  private confirmCancel(n: TreeNode): void {
    const cur = n.classId!;
    const prev = CLASSES[cur].parent!;
    new Dialog(this, {
      title: t('meta.cancel_title'),
      body: t('meta.cancel_body', { pct: Math.round(GAMEPLAY.cancelMetamorphosisRefund * 100) }),
      content: (s, c) => this.classArrow(s, c, cur, prev),
      buttons: [
        { label: t('common.no') },
        {
          label: t('common.yes'),
          style: 'red',
          onClick: () => {
            const { refund } = applyCancelMetamorphosis(this.tree, this.ls, cur);
            if (refund > 0) Store.addSouls(refund, false);
            if (Store.activeClass === cur) Store.setActiveClass(prev);
            Store.save();
            AUDIO.play('break');
            this.refresh();
            this.refreshTop();
            this.select(this.tree.classNode[prev]!);
          },
        },
      ],
    });
  }

  private commit(n: TreeNode, cost: number): void {
    if (!Store.spendSouls(cost)) return;
    applyBuy(this.tree, this.ls, n);
    const first = !Store.data.tutorial.skill;
    Store.data.tutorial.skill = true;
    this.autoBtn?.setVisible(true);
    if (n.kind === 'class') {
      Store.bump('metamorphoses');
      Store.setActiveClass(n.classId!);
      this.cameras.main.flash(300, 255, 220, 120);
      AUDIO.play('reward');
    } else {
      AUDIO.play(n.kind === 'perk' ? 'reward' : 'upgrade');
    }
    Store.save();
    this.refresh();
    this.refreshTop();
    const v = this.views.get(n.id)!;
    this.burst(v.x, v.y, n.kind === 'stat' ? Phaser.Display.Color.HexStringToColor(STAT_COLOR[n.stat!]).color : 0xffd86b);
    this.showInfo(n);
    if (first) this.clearHint();
    if (n.kind !== 'stat') toast(this, t('toast.reward'), 'svg_trophy');
    // Автопрокачка: купленная вручную характеристика задаёт ветку — вся ветка ниже прокачивается на все души
    if (Store.autoSkillCfg().on) {
      Store.noteManualBuy(n);
      const plan = Store.runAutoSkill();
      if (plan?.buys.length) this.announceAuto(plan);
    }
  }

  private burst(x: number, y: number, color: number): void {
    const ring = this.add.image(x, y, 'ring').setTint(color).setDepth(40).setDisplaySize(40, 40);
    this.tweens.add({ targets: ring, displayWidth: 240, displayHeight: 240, alpha: 0, duration: 500, onComplete: () => ring.destroy() });
    for (let i = 0; i < 14; i++) {
      const s = this.add.image(x, y, 'spark').setTint(color).setDepth(40).setScale(0.5 + Math.random() * 0.6);
      const a = Math.random() * Math.PI * 2;
      const d = 60 + Math.random() * 90;
      this.tweens.add({ targets: s, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, angle: 180, duration: 550, onComplete: () => s.destroy() });
    }
  }

  // ------------------------------------------------------------------------------ обучение и выбор по умолчанию

  private pickInitialSelection(last: TreeNode): TreeNode {
    let best: TreeNode | null = null;
    let bestD = Infinity;
    const lv = this.views.get(last.id)!;
    for (const [id, v] of this.views) {
      if (this.states.get(id) !== 'available') continue;
      const d = Math.hypot(v.x - lv.x, v.y - lv.y);
      if (d < bestD) {
        bestD = d;
        best = v.node;
      }
    }
    return best ?? last;
  }

  private setupTutorial(): void {
    if (Store.data.tutorial.skill) return;
    let best: NodeView | null = null;
    for (const [id, v] of this.views) {
      if (this.states.get(id) !== 'available') continue;
      if (canBuy(this.tree, this.ls, v.node, Store.souls).ok && (!best || costOf(v.node) < costOf(best.node))) best = v;
    }
    if (!best) return;
    this.select(best.node);
    this.pan.setCenter(best.x, best.y + 90);
    const text = txt(this, GAME_W / 2, 176, t('tut.skill_buy'), 26, { color: HEX.gold, wrap: 640 }).setScrollFactor(0).setDepth(720);
    const hand = tapHint(this, best.x, best.y + 36);
    this.hint.push(text, hand);
  }

  private clearHint(): void {
    this.hint.forEach((h) => h.destroy());
    this.hint = [];
  }

  private close(): void {
    if (this.closing) return;
    this.closing = true;
    AUDIO.play('click');
    Store.save();
    leaveMenu(this, 'Hub', { from: 'skill' });
  }
}
