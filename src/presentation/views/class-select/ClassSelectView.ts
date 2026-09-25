import Phaser from 'phaser';

import type { IClassSelectView } from '../../../application/class-select/interfaces/IClassSelectView';
import type { ClassId, LineageId } from '../../../domain/catalog';
import type { Trait, TraitId } from '../../../domain/progression';
import { describeTrait, t, type TKey } from '../../../i18n';
import {
  addEmbers,
  background,
  closeButton,
  icon,
  PlateButton,
  plateTexture,
  shadowTexture,
  staggerIn,
  statChip,
  statDisc,
  toast,
  txt,
  UiSound,
} from '../../components';
import { dollyIn } from '../../navigation/SceneTransitions';
import { CAROUSEL, GAME_W, HEX, LINEAGE_COLOR, statHex } from '../../theme';
import type { CarouselItem } from './interfaces/CarouselItem';
import type { ClassSelectViewDeps } from './interfaces/ClassSelectViewDeps';

/**
 * Выбор героя: карусель гербов (листается пальцем, стрелками и клавишами), под ней — что даёт
 * класс, рекорд героя и главная кнопка. Экран отдаёт выбор командой; открыть героя, сменить
 * его или начать забег решает приложение.
 */
export class ClassSelectView implements IClassSelectView {
  private static readonly ROT = Math.PI / 2;
  private static readonly CY = 470;
  private static readonly PANEL = { y: 950, w: 624, h: 500 } as const;
  /** Значок строки сводки: цвет и иконка по смыслу (механика линейки, особые умения, характеристики). */
  private static readonly TRAIT_STAT: Partial<Record<TraitId, string>> = {
    crit: 'crit',
    dodge: 'dodge',
    parry: 'parry',
    armor: 'defense',
    dmg: 'damage',
    hp: 'health',
  };

  private readonly items: CarouselItem[] = [];
  /** Положение карусели (дробное во время листания) и куда она доезжает. */
  private pos = 0;
  private target = 0;
  private readonly pulseK = { v: 1 };
  private dragStart: { x: number; pos: number } | null = null;
  private dragMoved = 0;
  private readonly info: Phaser.GameObjects.Container;
  private readonly chips: Phaser.GameObjects.Container;
  private readonly nameText: Phaser.GameObjects.Text;
  private readonly climbText: Phaser.GameObjects.Text;
  private readonly traits: Phaser.GameObjects.Container;
  private readonly action: PlateButton;
  private shownIndex = -1;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly d: ClassSelectViewDeps,
  ) {
    const mode = d.selection.mode;
    background(scene);
    addEmbers(scene, 10);
    dollyIn(scene, 380);

    const title = txt(
      scene,
      GAME_W / 2,
      92,
      mode === 'first' ? t('select.first') : t('select.title'),
      48,
      { font: 'title', color: HEX.gold, strokeThickness: 6 },
    );

    const choices = d.selection.choices();
    choices.forEach((c) => this.items.push(this.buildItem(c.classId, c.lineage, c.opened)));
    this.pos = this.target = d.selection.initialIndex(choices);

    // --- панель класса и главная кнопка
    const { y, w, h } = ClassSelectView.PANEL;
    this.info = scene.add.container(GAME_W / 2, y).setDepth(30);
    this.info.add(scene.add.image(0, 10, shadowTexture(scene, w, h, 34, 24)).setAlpha(0.9));
    this.info.add(scene.add.image(0, 0, plateTexture(scene, w, h, 1, 'panel', 34)));
    this.nameText = txt(scene, 0, -212, '', 46, {
      font: 'title',
      color: HEX.gold,
      maxWidth: w - 60,
      strokeThickness: 0,
    });
    this.info.add(this.nameText);
    // у каждого героя свой рекорд забега и свой кошелёк — рекорд видно прямо в выборе героя
    this.climbText = txt(scene, 0, -174, '', 21, {
      color: HEX.textDim,
      weight: 800,
      strokeThickness: 0,
    });
    this.info.add(this.climbText);
    this.info.add(
      scene.add
        .image(0, -172, 'px')
        .setTint(0xffffff)
        .setAlpha(0.1)
        .setDisplaySize(w - 80, 2),
    );
    // краткая сводка «что даёт класс»: до четырёх строк, выровнены по центру блока
    this.traits = scene.add.container(0, 0);
    this.info.add(this.traits);
    this.info.add(
      scene.add
        .image(0, -8, 'px')
        .setTint(0xffffff)
        .setAlpha(0.1)
        .setDisplaySize(w - 80, 2),
    );
    this.chips = scene.add.container(0, 42);
    this.info.add(this.chips);
    this.action = new PlateButton(scene, GAME_W / 2, y + 152, {
      w: 480,
      h: 88,
      label: '',
      fontSize: 34,
      style: 'gold',
      radius: 30,
      pulse: { cycle: 3000, scale: 1.02 },
      onClick: () => d.commands({ type: 'choose', classId: this.currentItem().classId }),
    });
    this.action.setDepth(31);

    this.buildArrows();
    scene.tweens.add({
      targets: this.pulseK,
      v: CAROUSEL.pulseScale,
      duration: CAROUSEL.pulseCycle / 2,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.bindInput();

    const back = (): void => d.commands({ type: 'back' });
    const close = mode === 'switch' ? closeButton(scene, back) : null;
    if (mode === 'switch') scene.input.keyboard?.on('keydown-ESC', back);
    const hint = txt(scene, GAME_W / 2, 1238, t('select.hint'), 22, {
      color: HEX.textMute,
      weight: 700,
      strokeThickness: 0,
    });
    this.layout();
    this.refreshInfo(true);

    // вход: заголовок опускается, панель класса и кнопка поднимаются снизу
    staggerIn(scene, close ? [title, close] : [title], { dy: -24, delay: 120, gap: 60 });
    staggerIn(scene, [this.info, this.action, hint], { dy: 70, delay: 220, gap: 70, ms: 420 });
  }

  /** Каждый кадр: расстановка карусели. */
  update(): void {
    this.layout();
  }

  started(): void {
    UiSound.play('reward');
  }

  unlocked(classId: ClassId): void {
    UiSound.play('upgrade');
    const it = this.items.find((i) => i.classId === classId);
    if (it) {
      it.opened = true;
      it.lock.setVisible(false);
    }
    toast(this.scene, t('toast.reward'));
    this.refreshInfo(true);
  }

  noGold(): void {
    UiSound.play('error');
    toast(this.scene, t('select.not_enough'), 'ico_gold');
  }

  switched(): void {
    UiSound.play('upgrade');
  }

  // ------------------------------------------------------------------------------ карусель

  private bindInput(): void {
    const input = this.scene.input;
    input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.y < 180 || p.y > 690) return;
      this.dragStart = { x: p.x, pos: this.pos };
      this.dragMoved = 0;
    });
    input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.dragStart || !p.isDown) return;
      const dx = p.x - this.dragStart.x;
      this.dragMoved = Math.max(this.dragMoved, Math.abs(dx));
      this.pos = this.dragStart.pos - dx / 230;
      this.target = Math.round(this.pos);
    });
    input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (!this.dragStart) return;
      const moved = this.dragMoved;
      const dx = p.x - this.dragStart.x;
      this.dragStart = null;
      if (moved < 12) this.tapAt(p.x, p.y);
      else this.target = Math.round(this.pos - dx / 700);
      this.snap();
    });
    input.keyboard?.on('keydown-LEFT', () => this.step(-1));
    input.keyboard?.on('keydown-RIGHT', () => this.step(1));
    input.keyboard?.on('keydown-A', () => this.step(-1));
    input.keyboard?.on('keydown-D', () => this.step(1));
  }

  private step(dir: number): void {
    this.target = Math.round(this.target + dir);
    this.snap();
  }

  private snap(): void {
    const tweens = this.scene.tweens;
    tweens.killTweensOf(this);
    const n = this.items.length;
    tweens.add({
      targets: this,
      pos: this.target,
      duration: 260,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.pos = ((this.pos % n) + n) % n;
        this.target = Math.round(this.pos);
      },
    });
    UiSound.play('click');
  }

  private wrap(o: number): number {
    const n = this.items.length;
    return ((((o + n / 2) % n) + n) % n) - n / 2;
  }

  private tapAt(x: number, y: number): void {
    let best = -1;
    let bestD = 140;
    this.items.forEach((it, i) => {
      const dist = Phaser.Math.Distance.Between(x, y, it.container.x, it.container.y);
      if (
        dist < bestD &&
        this.wrap(i - this.pos) !== 0 &&
        Math.abs(this.wrap(i - this.pos)) < 1.6
      ) {
        best = i;
        bestD = dist;
      }
    });
    if (best >= 0) this.target = Math.round(this.pos + this.wrap(best - this.pos));
  }

  private buildArrows(): void {
    const mk = (x: number, dir: -1 | 1): void => {
      const b = new PlateButton(this.scene, x, ClassSelectView.CY + 40, {
        w: 60,
        h: 60,
        icon: 'svg_chevron',
        iconSize: 24,
        radius: 30,
        onClick: () => this.step(dir),
      });
      if (dir < 0) b.iconImg?.setFlipX(true);
    };
    mk(34, -1);
    mk(GAME_W - 34, 1);
  }

  private buildItem(classId: ClassId, lineage: LineageId, opened: boolean): CarouselItem {
    const s = this.scene;
    const col = Phaser.Display.Color.HexStringToColor(LINEAGE_COLOR[lineage]).color;
    const container = s.add.container(GAME_W / 2, ClassSelectView.CY);
    const glow = s.add
      .image(0, 0, 'glow')
      .setTint(col)
      .setDisplaySize(520, 520)
      .setBlendMode(Phaser.BlendModes.ADD);
    const pic = s.add.image(0, 0, `cls_${classId}`).setDisplaySize(300, 300);
    const lock = s.add.container(0, 0);
    lock.add([
      s.add.image(0, 0, plateTexture(s, 116, 116, 1, 'raised', 58)),
      icon(s, 0, 0, 'svgw_lock', 60),
    ]);
    lock.setVisible(!opened);
    if (!opened) pic.setTint(0x777788);
    container.add([glow, pic, lock]);
    return { classId, opened, container, glow, pic, lock };
  }

  private layout(): void {
    const n = this.items.length;
    let front = 0;
    let best = 9;
    this.items.forEach((it, i) => {
      const o = this.wrap(i - this.pos);
      if (Math.abs(o) < best) {
        best = Math.abs(o);
        front = i;
      }
      const th = o * ClassSelectView.ROT;
      const z = Math.cos(th);
      const near = Math.abs(o) <= 2.01;
      let s =
        z >= 0
          ? CAROUSEL.inactiveScale + (CAROUSEL.activeScale - CAROUSEL.inactiveScale) * z * z
          : CAROUSEL.inactiveScale + 0.12 * z;
      const active = Phaser.Math.Clamp(1 - Math.abs(o), 0, 1);
      s *= 1 + (this.pulseK.v - 1) * active;
      it.container.setPosition(GAME_W / 2 + Math.sin(th) * 236, ClassSelectView.CY + (1 - z) * 70);
      it.container.setScale(s);
      it.container.setDepth(z * 10 + 10);
      it.container.setVisible(near && z > -0.35);
      it.container.setAlpha(Phaser.Math.Clamp((z + 0.35) * 2.2, 0, 1));
      const dark = Phaser.Math.Clamp(0.35 + 0.65 * Math.pow(Math.max(0, z), 3), 0.35, 1);
      const c = Math.round(255 * dark);
      const tint = Phaser.Display.Color.GetColor(c, c, c);
      if (it.opened) it.pic.setTint(tint);
      else it.pic.setTint(Phaser.Display.Color.GetColor(c * 0.5, c * 0.5, c * 0.55));
      it.glow.setAlpha(Math.pow(active, 2) * 0.8);
    });
    if (n && front !== this.shownIndex && best < 0.3) {
      this.shownIndex = front;
      this.refreshInfo(false);
    }
  }

  // ------------------------------------------------------------------------------ панель класса

  private currentItem(): CarouselItem {
    return this.items[
      ((Math.round(this.pos) % this.items.length) + this.items.length) % this.items.length
    ];
  }

  private refreshInfo(first: boolean): void {
    const s = this.scene;
    const it = this.currentItem();
    const choice = this.d.selection.choice(it.classId);
    this.nameText.setText(t(`class.${it.classId}.name` as TKey));
    this.climbText.setText(t('select.climb', { n: choice.climbed, max: choice.total }));
    this.climbText.setColor(choice.climbed >= choice.total ? HEX.gold : HEX.textDim);

    // сводка: цветной значок + короткая строка; блок центрируется по вертикали
    this.traits.removeAll(true);
    const list = choice.traits;
    const lineH = 38;
    const w = ClassSelectView.PANEL.w;
    const lines: Phaser.GameObjects.Text[] = [];
    list.forEach((tr, i) => {
      const y = -90 + (i - (list.length - 1) / 2) * lineH;
      const vis = ClassSelectView.traitVisual(tr, LINEAGE_COLOR[choice.lineage]);
      this.traits.add(
        statDisc(s, -w / 2 + 52, y, vis.stat, 28, { color: vis.color, iconKey: vis.iconKey }),
      );
      const line = txt(s, -w / 2 + 84, y, describeTrait(tr), 23, {
        origin: [0, 0.5],
        weight: 700,
        strokeThickness: 0,
        align: 'left',
        maxWidth: w - 84 - 30,
      });
      lines.push(line);
      this.traits.add(line);
    });
    // длинные строки ужимаются — приводим весь блок к одному размеру шрифта, чтобы он выглядел ровно
    const size = Math.min(...lines.map((l) => parseInt(String(l.style.fontSize), 10)));
    lines.forEach((l) => l.setFontSize(size));

    // основные показатели класса (с учётом стартового перка)
    this.chips.removeAll(true);
    const st = choice.stats;
    [
      ['health', String(st.maxHp)],
      ['damage', String(st.damage)],
      ['crit', `${Math.round(st.crit)}%`],
    ].forEach(([stat, val], i) => {
      this.chips.add(statChip(s, (i - 1) * 190, 0, stat, val, 44, 30, 'center'));
    });
    if (!first) {
      this.info.setAlpha(0.3);
      s.tweens.add({ targets: this.info, alpha: 1, duration: 220 });
    }
    if (choice.action === 'start')
      this.action.setLabel(t('select.start')).setStyle('gold').setLocked(false);
    else if (choice.action === 'unlock')
      this.action
        .setLabel(t('select.unlock', { n: this.d.selection.unlockCost }))
        .setStyle('gold')
        .setLocked(false);
    else if (choice.action === 'current')
      this.action.setLabel(t('select.current')).setStyle('raised').setLocked(true);
    else this.action.setLabel(t('select.pick')).setStyle('gold').setLocked(false);
  }

  private static traitVisual(
    tr: Trait,
    lineageColor: string,
  ): { stat: string; color: number; iconKey: string } {
    const stat = ClassSelectView.TRAIT_STAT[tr.id];
    if (stat) return { stat, color: statHex(stat), iconKey: `svg_${stat}` };
    if (tr.id === 'mech')
      return {
        stat: 'damage',
        color: Phaser.Display.Color.HexStringToColor(lineageColor).color,
        iconKey: 'svg_sword',
      };
    return { stat: 'damage', color: 0xf0c75e, iconKey: 'svg_bolt' };
  }
}
