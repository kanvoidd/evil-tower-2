import Phaser from 'phaser';
import type { ClassId, LineageId } from '../types';
import { CLASSES, LINEAGE_ORDER } from '../data/classes';
import { CAROUSEL, GAMEPLAY, GAME_W, HEX } from '../config';
import { Store } from '../systems/Store';
import { AUDIO } from '../systems/Audio';
import { YSDK } from '../sdk/YandexSDK';
import { describeTrait, t } from '../i18n';
import type { TKey } from '../i18n';
import { currentClassOf, TREES } from '../logic/skillTree';
import { classStartStats, classTraits, type Trait, type TraitId } from '../logic/traits';
import { LINEAGE_COLOR, statHex } from '../ui/Textures';
import {
  addEmbers, background, closeButton, Dialog, dollyIn, fadeToScene, icon, plateTexture, PlateButton, pulse, shadowTexture, staggerIn,
  statChip, statDisc, toast, txt,
} from '../ui/Kit';

interface Item {
  classId: ClassId;
  opened: boolean;
  container: Phaser.GameObjects.Container;
  glow: Phaser.GameObjects.Image;
  pic: Phaser.GameObjects.Image;
  lock: Phaser.GameObjects.Container;
}

const ROT = Math.PI / 2;
const CY = 470;
const PANEL = { y: 950, w: 624, h: 500 };

/** Значок строки сводки: цвет и иконка по смыслу (механика линейки, особые умения, характеристики). */
const TRAIT_STAT: Partial<Record<TraitId, string>> = { crit: 'crit', dodge: 'dodge', parry: 'parry', armor: 'defense', dmg: 'damage', luck: 'luck', hp: 'health' };

const traitVisual = (tr: Trait, lineageColor: string): { stat: string; color: number; iconKey: string } => {
  const stat = TRAIT_STAT[tr.id];
  if (stat) return { stat, color: statHex(stat), iconKey: `svg_${stat}` };
  if (tr.id === 'mech') return { stat: 'damage', color: Phaser.Display.Color.HexStringToColor(lineageColor).color, iconKey: 'svg_sword' };
  return { stat: 'damage', color: 0xf0c75e, iconKey: 'svg_bolt' };
};

export class ClassSelectScene extends Phaser.Scene {
  private mode: 'first' | 'switch' = 'first';
  private from: string = 'Hub';
  private items: Item[] = [];
  private pos = 0;
  private target = 0;
  private pulseK = { v: 1 };
  private dragStart: { x: number; pos: number } | null = null;
  private dragMoved = 0;
  private info!: Phaser.GameObjects.Container;
  private chips!: Phaser.GameObjects.Container;
  private nameText!: Phaser.GameObjects.Text;
  private traits!: Phaser.GameObjects.Container;
  private action!: PlateButton;
  private shownIndex = -1;

  constructor() {
    super('ClassSelect');
  }

  init(data: { mode?: 'first' | 'switch'; from?: string; zoomIn?: boolean } = {}): void {
    this.mode = data.mode ?? 'first';
    this.from = data.from ?? 'Hub';
    this.items = [];
    this.pos = 0;
    this.shownIndex = -1;
  }

  create(): void {
    YSDK.ready();
    background(this);
    addEmbers(this, 10);
    dollyIn(this, 380);

    const title = txt(this, GAME_W / 2, 92, this.mode === 'first' ? t('select.first') : t('select.title'), 48, { font: 'title', color: HEX.gold, strokeThickness: 6 });

    const list: Array<{ id: ClassId; opened: boolean }> = [];
    for (const l of LINEAGE_ORDER) {
      if (this.mode === 'first') {
        list.push({ id: l, opened: true });
      } else if (Store.isLineageUnlocked(l)) {
        // одна запись на линейку: улучшенный класс заменяет прежний (наёмник → ассасин), назад пути нет
        list.push({ id: currentClassOf(TREES[l], Store.lineageSave(l)!), opened: true });
      } else {
        list.push({ id: l, opened: false });
      }
    }

    list.forEach((it) => this.items.push(this.buildItem(it.id, it.opened)));
    const idx = Math.max(0, this.items.findIndex((i) => i.classId === Store.activeClass));
    this.pos = this.target = this.mode === 'first' ? 0 : idx;

    this.buildInfo();
    this.buildArrows();
    this.tweens.add({ targets: this.pulseK, v: CAROUSEL.pulseScale, duration: CAROUSEL.pulseCycle / 2, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.y < 180 || p.y > 690) return;
      this.dragStart = { x: p.x, pos: this.pos };
      this.dragMoved = 0;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.dragStart || !p.isDown) return;
      const dx = p.x - this.dragStart.x;
      this.dragMoved = Math.max(this.dragMoved, Math.abs(dx));
      this.pos = this.dragStart.pos - dx / 230;
      this.target = Math.round(this.pos);
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (!this.dragStart) return;
      const moved = this.dragMoved;
      const dx = p.x - this.dragStart.x;
      this.dragStart = null;
      if (moved < 12) this.tapAt(p.x, p.y);
      else this.target = Math.round(this.pos - dx / 700);
      this.snap();
    });
    this.input.keyboard?.on('keydown-LEFT', () => this.step(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.step(1));
    this.input.keyboard?.on('keydown-A', () => this.step(-1));
    this.input.keyboard?.on('keydown-D', () => this.step(1));

    const close = this.mode === 'switch' ? closeButton(this, () => this.back()) : null;
    if (this.mode === 'switch') this.input.keyboard?.on('keydown-ESC', () => this.back());
    const hint = txt(this, GAME_W / 2, 1238, t('select.hint'), 22, { color: HEX.textMute, weight: 700, strokeThickness: 0 });
    this.layout();
    this.refreshInfo(true);

    // вход: заголовок опускается, панель класса и кнопка поднимаются снизу
    staggerIn(this, close ? [title, close] : [title], { dy: -24, delay: 120, gap: 60 });
    staggerIn(this, [this.info, this.action, hint], { dy: 70, delay: 220, gap: 70, ms: 420 });
  }

  private back(): void {
    fadeToScene(this, this.from);
  }

  private step(d: number): void {
    this.target = Math.round(this.target + d);
    this.snap();
  }

  private snap(): void {
    this.tweens.killTweensOf(this);
    const n = this.items.length;
    this.tweens.add({
      targets: this,
      pos: this.target,
      duration: 260,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.pos = ((this.pos % n) + n) % n;
        this.target = Math.round(this.pos);
      },
    });
    AUDIO.play('click');
  }

  private wrap(o: number): number {
    const n = this.items.length;
    return ((((o + n / 2) % n) + n) % n) - n / 2;
  }

  private tapAt(x: number, y: number): void {
    let best = -1;
    let bestD = 140;
    this.items.forEach((it, i) => {
      const d = Phaser.Math.Distance.Between(x, y, it.container.x, it.container.y);
      if (d < bestD && this.wrap(i - this.pos) !== 0 && Math.abs(this.wrap(i - this.pos)) < 1.6) {
        best = i;
        bestD = d;
      }
    });
    if (best >= 0) this.target = Math.round(this.pos + this.wrap(best - this.pos));
  }

  private buildArrows(): void {
    const mk = (x: number, dir: -1 | 1): void => {
      const b = new PlateButton(this, x, CY + 40, { w: 60, h: 60, icon: 'svg_chevron', iconSize: 24, radius: 30, onClick: () => this.step(dir) });
      if (dir < 0) b.iconImg?.setFlipX(true);
    };
    mk(34, -1);
    mk(GAME_W - 34, 1);
  }

  private buildItem(classId: ClassId, opened: boolean): Item {
    const col = Phaser.Display.Color.HexStringToColor(LINEAGE_COLOR[CLASSES[classId].lineage]).color;
    const container = this.add.container(GAME_W / 2, CY);
    const glow = this.add.image(0, 0, 'glow').setTint(col).setDisplaySize(520, 520).setBlendMode(Phaser.BlendModes.ADD);
    const pic = this.add.image(0, 0, `cls_${classId}`).setDisplaySize(300, 300);
    const lock = this.add.container(0, 0);
    lock.add([this.add.image(0, 0, plateTexture(this, 116, 116, 1, 'raised', 58)), icon(this, 0, 0, 'svgw_lock', 60)]);
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
      const th = o * ROT;
      const z = Math.cos(th);
      const near = Math.abs(o) <= 2.01;
      let s = z >= 0 ? CAROUSEL.inactiveScale + (CAROUSEL.activeScale - CAROUSEL.inactiveScale) * z * z : CAROUSEL.inactiveScale + 0.12 * z;
      const active = Phaser.Math.Clamp(1 - Math.abs(o), 0, 1);
      s *= 1 + (this.pulseK.v - 1) * active;
      it.container.setPosition(GAME_W / 2 + Math.sin(th) * 236, CY + (1 - z) * 70);
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

  update(): void {
    this.layout();
  }

  private buildInfo(): void {
    const { y, w, h } = PANEL;
    this.info = this.add.container(GAME_W / 2, y).setDepth(30);
    this.info.add(this.add.image(0, 10, shadowTexture(this, w, h, 34, 24)).setAlpha(0.9));
    this.info.add(this.add.image(0, 0, plateTexture(this, w, h, 1, 'panel', 34)));
    this.nameText = txt(this, 0, -208, '', 46, { font: 'title', color: HEX.gold, maxWidth: w - 60, strokeThickness: 0 });
    this.info.add(this.nameText);
    this.info.add(this.add.image(0, -172, 'px').setTint(0xffffff).setAlpha(0.1).setDisplaySize(w - 80, 2));
    // краткая сводка «что даёт класс»: до четырёх строк, выровнены по центру блока
    this.traits = this.add.container(0, 0);
    this.info.add(this.traits);
    this.info.add(this.add.image(0, -8, 'px').setTint(0xffffff).setAlpha(0.1).setDisplaySize(w - 80, 2));
    this.chips = this.add.container(0, 42);
    this.info.add(this.chips);
    this.action = new PlateButton(this, GAME_W / 2, y + 152, {
      w: 480, h: 88, label: '', fontSize: 34, style: 'gold', radius: 30, pulse: { cycle: 3000, scale: 1.02 },
      onClick: () => this.onAction(),
    });
    this.action.setDepth(31);
  }

  private currentItem(): Item {
    return this.items[((Math.round(this.pos) % this.items.length) + this.items.length) % this.items.length];
  }

  private refreshInfo(first: boolean): void {
    const it = this.currentItem();
    const cls = CLASSES[it.classId];
    this.nameText.setText(t(`class.${it.classId}.name` as TKey));

    // сводка: цветной значок + короткая строка; блок центрируется по вертикали
    this.traits.removeAll(true);
    const list = classTraits(it.classId);
    const lineH = 38;
    const w = PANEL.w;
    const lines: Phaser.GameObjects.Text[] = [];
    list.forEach((tr, i) => {
      const y = -90 + (i - (list.length - 1) / 2) * lineH;
      const vis = traitVisual(tr, LINEAGE_COLOR[cls.lineage]);
      this.traits.add(statDisc(this, -w / 2 + 52, y, vis.stat, 28, { color: vis.color, iconKey: vis.iconKey }));
      const line = txt(this, -w / 2 + 84, y, describeTrait(tr), 23, {
        origin: [0, 0.5], weight: 700, strokeThickness: 0, align: 'left', maxWidth: w - 84 - 30,
      });
      lines.push(line);
      this.traits.add(line);
    });
    // длинные строки ужимаются — приводим весь блок к одному размеру шрифта, чтобы он выглядел ровно
    const size = Math.min(...lines.map((l) => parseInt(String(l.style.fontSize), 10)));
    lines.forEach((l) => l.setFontSize(size));

    // основные показатели класса (с учётом стартового перка)
    this.chips.removeAll(true);
    const s = classStartStats(it.classId);
    [['health', String(s.maxHp)], ['damage', String(s.damage)], ['crit', `${Math.round(s.crit)}%`]].forEach(([stat, val], i) => {
      this.chips.add(statChip(this, (i - 1) * 190, 0, stat, val, 44, 30, 'center'));
    });
    if (!first) {
      this.info.setAlpha(0.3);
      this.tweens.add({ targets: this.info, alpha: 1, duration: 220 });
    }
    const current = this.mode === 'switch' && it.classId === Store.activeClass;
    if (this.mode === 'first') this.action.setLabel(t('select.start')).setStyle('gold').setLocked(false);
    else if (!it.opened) this.action.setLabel(t('select.unlock', { n: GAMEPLAY.classUnlockCost })).setStyle('gold').setLocked(false);
    else if (current) this.action.setLabel(t('select.current')).setStyle('raised').setLocked(true);
    else this.action.setLabel(t('select.pick')).setStyle('gold').setLocked(false);
  }

  private onAction(): void {
    const it = this.currentItem();
    if (this.mode === 'first') {
      const lineage = CLASSES[it.classId].lineage;
      Store.unlockLineage(lineage);
      Store.setActiveClass(it.classId);
      AUDIO.play('reward');
      fadeToScene(this, 'Game', { roomId: '1-1' });
      return;
    }
    if (!it.opened) {
      const lineage = CLASSES[it.classId].lineage as LineageId;
      if (Store.buyLineage(lineage)) {
        AUDIO.play('upgrade');
        it.opened = true;
        it.lock.setVisible(false);
        toast(this, t('toast.reward'));
        this.refreshInfo(true);
      } else {
        AUDIO.play('error');
        toast(this, t('select.not_enough'), 'ico_gold');
      }
      return;
    }
    if (it.classId === Store.activeClass) return;
    new Dialog(this, {
      title: t('select.change_title'),
      body: t('select.change_body', { name: t(`class.${it.classId}.name` as TKey) }),
      content: (scene, c) => {
        const img = scene.add.image(0, 96, `cls_${it.classId}`).setDisplaySize(190, 190);
        c.add(img);
        pulse(scene, img, 3200, 1.04);
        return 200;
      },
      buttons: [
        { label: t('common.cancel') },
        {
          label: t('common.continue'),
          style: 'gold',
          onClick: () => {
            Store.setActiveClass(it.classId);
            AUDIO.play('upgrade');
            this.back();
          },
        },
      ],
    });
  }
}
