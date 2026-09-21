import Phaser from 'phaser';
import type { AutoUseSave, CardKind, ConsumableId } from '../types';
import { CONSUMABLE_SLOTS, CONSUMABLES, ITEM_BY_ID } from '../data/items';
import { ENEMIES } from '../data/enemies';
import { ROOM_BY_ID, ROOMS } from '../data/levels';
import { FULL_BAR, PERK_BY_ID, type PerkDef } from '../data/perks';
import { GAME_W, GAMEPLAY, HEX, TIMING } from '../config';
import { YSDK } from '../sdk/YandexSDK';
import { AUDIO } from '../systems/Audio';
import { Store } from '../systems/Store';
import { maybeInterstitial, watchRewarded } from '../systems/Ads';
import { fmt, perkDesc, perkName, t, tr } from '../i18n';
import type { TKey } from '../i18n';
import { makeRng, randomSeed } from '../logic/rng';
import { Run, type Card, type GameEvent, type Loot } from '../logic/run';
import { STATUS_TINT } from '../ui/Textures';
import { needsHeal, needsRegen, pickAutoUse, worthArtifact } from '../logic/autoUse';
import { CARD_H, CARD_W } from '../ui/Textures';
import {
  background, bindToasts, CurrencyBar, Dialog, dollyIn, fadeToScene, icon, outlineTexture, PlateButton, plateTexture, shadowTexture, soundButton,
  statChip, statPill, tapHint, tipOnHover, toast, txt, type DialogBtn, type Pill,
} from '../ui/Kit';

const BOARD = { x0: 42, y0: 246, gap: 18 };

const cellPos = (cell: number): { x: number; y: number } => ({
  x: BOARD.x0 + (cell % 3) * (CARD_W + BOARD.gap) + CARD_W / 2,
  y: BOARD.y0 + Math.floor(cell / 3) * (CARD_H + BOARD.gap) + CARD_H / 2,
});

const RES_COLOR: Record<string, number> = {
  stamina: 0xe9c94a, mana: 0x4f9bff, concentration: 0x46d68a, vigilance: 0xb287ff,
};

/** Ряд расходников: слоты и под ними переключатели «АВТО». */
const SLOT_Y = 68;
const AUTO_KEY: Record<ConsumableId, keyof AutoUseSave> = { potion_heal: 'heal', potion_regen: 'regen', artifact: 'artifact' };
const AUTO_TIP: Record<ConsumableId, TKey> = {
  potion_heal: 'auto.use.heal.tip', potion_regen: 'auto.use.regen.tip', artifact: 'auto.use.artifact.tip',
};

/** Центр «окна» с артом внутри карточки и линии подписей. */
const ART_Y = -33;
const LABEL_Y = 48;
const PILL_Y = 86;

interface View {
  c: Phaser.GameObjects.Container;
  uid: number;
  kind: CardKind | 'player';
  cell: number;
  frame: Phaser.GameObjects.Image;
  sprite: Phaser.GameObjects.Image;
  flash: Phaser.GameObjects.Image;
  hp?: Pill;
  atk?: Pill;
  shield?: Pill;
  statusRow?: Phaser.GameObjects.Container;
  defId: string;
}

/** Кнопка способности класса в нижнем ряду. */
interface PerkBtn {
  perk: PerkDef;
  btn: PlateButton;
  costText: Phaser.GameObjects.Text;
  frame: Phaser.GameObjects.Image;
}

/** Значки статусов на карточке врага: цвет и короткая подпись. */
const STATUS_TAG: Record<string, string> = {
  stun: '\u2736', burn: '\u2668', poison: '\u2620', mark: '\u25C6', link: '\u26AF', vuln: '!', weak: '\u2193',
};

interface Slot {
  id: ConsumableId;
  c: Phaser.GameObjects.Container;
  badge: Phaser.GameObjects.Container;
  count: Phaser.GameObjects.Text;
  hint: Phaser.GameObjects.Image;
  hintTween?: Phaser.Tweens.Tween;
  locked: boolean;
}

export class GameScene extends Phaser.Scene {
  private roomId = '1-1';
  private run!: Run;
  private views = new Map<number, View>();
  private playerView!: View;
  private busy = false;
  private alive = true;
  private finished = false;
  private lungeDone: Promise<void> = Promise.resolve();
  private initialSpawn = false;
  private slots: Slot[] = [];
  private perkBtns: PerkBtn[] = [];
  private modLabel?: Phaser.GameObjects.Text;
  private loot!: CurrencyBar;
  private pouch = 0;
  private runSouls = 0;
  private resGfx!: Phaser.GameObjects.Graphics;
  private resShown = 0;
  private resText!: Phaser.GameObjects.Text;
  private resBoost!: Phaser.GameObjects.Text;
  private enemyText!: Phaser.GameObjects.Text;
  private enemyBar!: Phaser.GameObjects.Graphics;
  private chipsRow!: Phaser.GameObjects.Container;
  private gearRow!: Phaser.GameObjects.Container;
  private hintText?: Phaser.GameObjects.Text;
  private hand?: Phaser.GameObjects.Container;
  private hintStage = 0;
  /** Сколько улучшений купила автопрокачка по итогам комнаты (сообщаем в окне результата). */
  private autoNote = 0;
  private resultInfo?: { result: 'win' | 'lose'; first: boolean; flawless: boolean; totalGold: number; totalSouls: number };

  constructor() {
    super('Game');
  }

  init(data: { roomId?: string } = {}): void {
    this.roomId = data.roomId ?? Store.frontierRoom;
    this.views = new Map();
    this.slots = [];
    this.perkBtns = [];
    this.busy = false;
    this.alive = true;
    this.finished = false;
    this.lungeDone = Promise.resolve();
    this.hintStage = 0;
    this.autoNote = 0;
    this.pouch = 0;
    this.runSouls = 0;
    this.resShown = 0;
    this.hand = undefined;
    this.hintText = undefined;
  }

  create(): void {
    dollyIn(this, 380);
    background(this);
    bindToasts(this);
    this.events.once('shutdown', () => {
      this.alive = false;
      YSDK.gameplayStop();
    });

    const room = ROOM_BY_ID[this.roomId];
    this.run = new Run({
      room,
      stats: Store.playerStats(),
      weapon: Store.equipped('weapon'),
      armor: Store.equipped('armor'),
      consumables: { ...Store.data.consumables },
      rng: makeRng(randomSeed()),
    });
    this.buildHud();
    this.buildBoardBackdrop();
    this.playerView = this.buildPlayer();
    this.setupInput();

    YSDK.gameplayStart();
    this.busy = true;
    this.initialSpawn = true;
    void this.playEvents(this.run.start()).then(() => {
      this.initialSpawn = false;
      this.busy = false;
      this.afterTurn();
    });
  }

  // ------------------------------------------------------------------------------ HUD

  private buildHud(): void {
    const room = this.run.room;

    // расходники: три слота слева сверху, счётчик — в бейдже на углу (не перекрывает иконку),
    // а под каждым — переключатель автоприменения «АВТО»
    CONSUMABLE_SLOTS.forEach((id, i) => {
      const x = 74 + i * 96;
      const y = SLOT_Y;
      const locked = !!CONSUMABLES[id].lineage && CONSUMABLES[id].lineage !== this.run.lineage;
      const c = this.add.container(x, y);
      c.add(this.add.image(0, 5, shadowTexture(this, 80, 80, 22, 10)).setAlpha(0.8));
      c.add(this.add.image(0, 0, plateTexture(this, 80, 80, 1, 'panel', 22)));
      const hint = this.add.image(0, 0, outlineTexture(this, 80, 80, 22, '#f0c75e', 4)).setVisible(false);
      c.add(hint);
      c.add(icon(this, 0, -1, locked ? 'svgw_lock' : CONSUMABLES[id].icon, locked ? 34 : 54).setAlpha(locked ? 0.4 : 1));
      const badge = this.add.container(28, 28);
      badge.add(this.add.circle(0, 0, 15, 0x0b0d12).setStrokeStyle(2, 0xf0c75e));
      const count = txt(this, 0, -1, '', 18, { weight: 900, strokeThickness: 0 });
      badge.add(count);
      c.add(badge);
      c.setSize(80, 80).setInteractive(new Phaser.Geom.Rectangle(0, 0, 80, 80), Phaser.Geom.Rectangle.Contains);
      c.on('pointerup', (p: Phaser.Input.Pointer) => {
        if (Phaser.Math.Distance.Between(p.x, p.y, p.downX, p.downY) < 20) this.useItem(id);
      });
      this.slots.push({ id, c, badge, count, hint, locked });
      if (!locked) this.buildAutoPill(id, x, y + 59);
    });

    // звук и добыча за комнату (золото в сумке + души) — справа сверху, без рамки
    soundButton(this, 486, SLOT_Y, 60);
    this.loot = new CurrencyBar(this, GAME_W - 32, 54, { manual: true, goldIcon: 'ico_pouch', compact: true });

    // название комнаты, рогаликовое свойство захода и счётчик врагов
    txt(this, GAME_W / 2, 152, `${t(`floor.${room.floor}.name` as TKey)} · ${t('game.room', { r: room.id })}`, 30, { font: 'title', color: HEX.gold, strokeThickness: 5 });
    const mod = this.run.mod;
    if (mod.id !== 'plain') {
      this.modLabel = txt(this, 0, 0, t(`mod.${mod.id}` as TKey), 21, { color: HEX.soul, weight: 900, strokeThickness: 3 });
      const holder = this.add.container(GAME_W / 2, 184, [this.modLabel]);
      holder.setSize(this.modLabel.width + 40, 34)
        .setInteractive(new Phaser.Geom.Rectangle(0, 0, this.modLabel.width + 40, 34), Phaser.Geom.Rectangle.Contains);
      tipOnHover(this, holder, () => `${t(`mod.${mod.id}` as TKey)}\n${t(`mod.${mod.id}.desc` as TKey)}`);
    }
    this.enemyText = txt(this, GAME_W / 2, 212, '', 20, { color: HEX.textDim, weight: 800, strokeThickness: 0 });
    this.enemyBar = this.add.graphics();

    // полоса ресурса класса
    this.add.image(GAME_W / 2, 1000, shadowTexture(this, 480, 40, 20, 10)).setAlpha(0.7);
    this.add.image(GAME_W / 2, 1000, plateTexture(this, 480, 40, 1, 'dark', 20));
    this.resGfx = this.add.graphics();
    this.resText = txt(this, GAME_W / 2, 999, '', 20, { weight: 900 });
    this.resBoost = txt(this, GAME_W / 2 + 268, 1000, '', 20, { color: HEX.gold, origin: [0, 0.5], weight: 900 });

    this.chipsRow = this.add.container(0, 0);
    this.gearRow = this.add.container(0, 0);

    // «сбежать» — левый нижний угол, правее — ряд кнопок способностей класса
    new PlateButton(this, 66, 1206, { w: 76, h: 76, icon: 'svg_arrow', iconSize: 36, radius: 24, onClick: () => this.askEscape() });
    this.input.keyboard?.on('keydown-ESC', () => this.askEscape());
    this.buildPerkRow();

    this.refreshHud();
  }

  /**
   * Переключатель автоприменения — маленькая кнопка «АВТО» прямо под расходником. Нажатие — включить/выключить,
   * наведение мыши или долгое нажатие — подсказка с понятным описанием, что именно и когда применяется само.
   */
  private buildAutoPill(id: ConsumableId, x: number, y: number): void {
    const key = AUTO_KEY[id];
    const w = 80;
    const h = 34;
    const c = Object.assign(this.add.container(x, y), { swallowClick: false });
    const plate = this.add.image(0, 0, plateTexture(this, w, h, 1, 'dark', h / 2));
    const label = txt(this, 0, -1, t('auto.tag'), 16, { weight: 900, strokeThickness: 0 });
    c.add([plate, label]);
    const refresh = (): void => {
      const on = Store.autoUse[key];
      plate.setTexture(plateTexture(this, w, h, 1, on ? 'green' : 'dark', h / 2));
      label.setColor(on ? '#0f3b23' : HEX.textDim);
    };
    refresh();
    // область нажатия чуть больше кнопки (палец крупнее), но вниз — чтобы не отнимать площадь у самого расходника
    c.setSize(w, h).setInteractive(new Phaser.Geom.Rectangle(-6, -2, w + 12, h + 18), Phaser.Geom.Rectangle.Contains);
    c.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (c.swallowClick) {
        c.swallowClick = false;
        return;
      }
      if (Phaser.Math.Distance.Between(p.x, p.y, p.downX, p.downY) > 20) return;
      const on = !Store.autoUse[key];
      const patch: Partial<AutoUseSave> = {};
      patch[key] = on;
      Store.setAutoUse(patch);
      AUDIO.play('click');
      refresh();
      this.popupAt(x, y + 32, `${t('auto.tag')}: ${t(on ? 'auto.on' : 'auto.off')}`, on ? HEX.good : HEX.textDim, 20);
      // если ситуация уже подходит — сработает сразу, не дожидаясь следующего хода
      if (on && !this.busy && !this.finished && !this.run.over) this.tryAutoUse();
    });
    tipOnHover(this, c, () => `${t(AUTO_TIP[id])}\n${t(Store.autoUse[key] ? 'auto.state.on' : 'auto.state.off')}`);
  }

  /**
   * Ряд кнопок способностей класса справа от «Сбежать». Нажатие «заряжает» способность:
   * следующее касание поля применяет её к цели. Способности без цели срабатывают сразу.
   */
  private buildPerkRow(): void {
    const list = this.run.stats.abilities;
    if (!list.length) return;
    const w = 92;
    const gap = 16;
    const total = list.length * w + (list.length - 1) * gap;
    const x0 = 130 + (560 - total) / 2 + w / 2;
    list.forEach((perk, i) => {
      const x = x0 + i * (w + gap);
      const btn = new PlateButton(this, x, 1206, {
        w, h: 86, icon: perk.icon, iconSize: 54, radius: 24, style: 'raised',
        onClick: () => this.onPerkTap(perk),
      });
      const frame = this.add.image(0, 0, outlineTexture(this, w, 86, 24, '#f0c75e', 4)).setVisible(false);
      btn.pulseC.add(frame);
      const costText = txt(this, 0, 30, '', 17, { weight: 900, strokeThickness: 3, color: HEX.gold });
      btn.pulseC.add(costText);
      tipOnHover(this, btn, () => `${perkName(perk)}\n${perkDesc(perk)}`);
      this.perkBtns.push({ perk, btn, costText, frame });
    });
    this.refreshPerkRow();
  }

  private perkCostLabel(perk: PerkDef): string {
    if (perk.goldCost !== undefined) return `${Math.round(perk.goldCost * 100)}%`;
    const cost = this.run.perkCostOf(perk);
    return cost === 0 ? t('common.free') : perk.cost === FULL_BAR ? '⚡' : String(cost);
  }

  private refreshPerkRow(): void {
    for (const pb of this.perkBtns) {
      const ready = this.run.perkReady(pb.perk);
      const armed = this.run.armed?.id === pb.perk.id;
      pb.btn.setStyle(armed ? 'gold' : 'raised');
      pb.btn.setLocked(!ready.ok);
      pb.frame.setVisible(armed);
      pb.costText.setText(this.perkCostLabel(pb.perk));
      pb.costText.setColor(armed ? HEX.dark : ready.ok ? HEX.gold : HEX.textMute);
      pb.btn.pulseC.setAlpha(ready.ok || armed ? 1 : 0.55);
    }
  }

  private onPerkTap(perk: PerkDef): void {
    if (this.busy || this.finished || this.run.over) return;
    const res = this.run.usePerk(perk.id);
    if (!res.ok) {
      AUDIO.play('error');
      const key: TKey = res.reason === 'once' ? 'game.once_used' : res.reason === 'gold' ? 'game.no_gold_perk' : 'game.no_res';
      this.popupAt(this.playerView.c.x, this.playerView.c.y - 100, t(key, { r: t(`res.${this.run.stats.resource}` as TKey) }), HEX.bad, 22);
      return;
    }
    Store.data.tutorial.perk = true;
    this.clearHand();
    // «заряжено»: ход не потрачен, ждём выбора цели
    if (this.run.armed || res.events.every((e) => e.type === 'armed')) {
      AUDIO.play('click');
      this.refreshPerkRow();
      this.highlightTargets();
      if (this.run.armed) {
        this.popupAt(GAME_W / 2, 980, t(this.run.armed.target === 'two' ? 'game.pick_two' : 'game.pick_target'), HEX.gold, 24);
      }
      return;
    }
    this.busy = true;
    void this.playEvents(res.events).then(() => {
      this.busy = false;
      this.afterTurn();
    });
  }

  /** Подсветка карт, по которым можно применить заряженную способность. */
  private highlightTargets(): void {
    const armed = this.run.armed;
    for (const v of this.views.values()) {
      if (v.kind === 'player') continue;
      const ok = !!armed && this.run.perkTargetOk(armed, v.cell);
      v.c.setAlpha(armed && !ok ? 0.45 : 1);
    }
  }

  private buildBoardBackdrop(): void {
    for (let i = 0; i < 9; i++) {
      const p = cellPos(i);
      this.add.image(p.x, p.y, plateTexture(this, CARD_W - 8, CARD_H - 8, 1, 'dark', 22)).setAlpha(0.45).setDepth(-10);
    }
  }

  private drawResource(): void {
    const s = this.run.stats;
    const k = Phaser.Math.Clamp(this.resShown / s.resMax, 0, 1);
    const g = this.resGfx;
    const h = 30;
    const x0 = GAME_W / 2 - 240 + 5;
    const y0 = 1000 - h / 2;
    const w = Math.max(h, 470 * k);
    g.clear();
    if (k <= 0) return;
    g.fillStyle(RES_COLOR[s.resource], 1).fillRoundedRect(x0, y0, w, h, h / 2);
    g.fillStyle(0xffffff, 0.24).fillRoundedRect(x0 + 4, y0 + 3, Math.max(4, w - 8), h / 2 - 3, (h / 2 - 3) / 2);
  }

  private refreshHud(): void {
    const s = this.run.stats;
    const r = this.run;
    // ресурс
    this.tweens.addCounter({
      from: this.resShown,
      to: r.res,
      duration: 200,
      onUpdate: (tw) => {
        this.resShown = tw.getValue() ?? r.res;
        this.drawResource();
      },
      onComplete: () => {
        this.resShown = r.res;
        this.drawResource();
      },
    });
    this.resText.setText(`${t(`res.${s.resource}` as TKey)}  ${Math.floor(r.res)}/${s.resMax}`);
    this.resBoost.setText(r.boost > 0 ? `x${GAMEPLAY.regenBoostMul}` : '');
    // характеристики: равномерный ряд, каждая метка центрируется
    this.chipsRow.removeAll(true);
    const chips: Array<[string, string]> = [
      ['damage', String(s.damage)], ['defense', String(s.defense)], ['crit', `${Math.round(s.crit)}%`],
      ['dodge', `${Math.round(s.dodge)}%`], ['parry', `${Math.round(s.parry)}%`],
    ];
    chips.forEach(([k2, v], i) => this.chipsRow.add(statChip(this, 72 + i * 144, 1062, k2, v, 34, 22, 'center')));
    // экипировка: иконка + полоска прочности
    this.gearRow.removeAll(true);
    const gear: Array<{ e: { id: string; durability: number } | null; x: number }> = [
      { e: r.weapon && r.weapon.durability > 0 ? r.weapon : null, x: 190 },
      { e: r.armor && r.armor.durability > 0 ? r.armor : null, x: 530 },
    ];
    gear.forEach(({ e, x }) => {
      if (!e) return;
      const it = ITEM_BY_ID[e.id];
      const k = Phaser.Math.Clamp(e.durability / it.durability, 0, 1);
      this.gearRow.add(icon(this, x - 66, 1122, it.icon, 46));
      this.gearRow.add(txt(this, x + 4, 1112, `${e.durability}/${it.durability}`, 18, { weight: 800, strokeThickness: 0, color: k <= 0.2 ? HEX.bad : HEX.textDim }));
      this.gearRow.add(this.add.rectangle(x + 4, 1132, 100, 7, 0x000000, 0.5));
      this.gearRow.add(this.add.rectangle(x - 46, 1132, Math.max(3, 100 * k), 7, k > 0.2 ? 0x66e39c : 0xff7468).setOrigin(0, 0.5));
    });
    // враги
    const total = r.totalEnemies;
    const left = r.enemiesLeft;
    this.enemyText.setText(t('game.enemies', { n: left }));
    this.enemyBar.clear();
    this.enemyBar.fillStyle(0x000000, 0.45).fillRoundedRect(GAME_W / 2 - 130, 228, 260, 7, 3.5);
    if (total > 0 && left < total) this.enemyBar.fillStyle(0xe5564d, 1).fillRoundedRect(GAME_W / 2 - 130, 228, Math.max(7, 260 * (1 - left / total)), 7, 3.5);
    // слоты расходников
    this.slots.forEach((sl) => {
      const n = r.consumables[sl.id];
      sl.count.setText(String(n));
      sl.badge.setVisible(!sl.locked && n > 0);
      sl.c.setAlpha(sl.locked ? 0.5 : n > 0 ? 1 : 0.5);
    });
    this.updateSlotHints();
  }

  /** Подсвечивает расходник, когда он действительно нужен (те же правила, что у автоприменения; лечение — с запасом). */
  private updateSlotHints(): void {
    const r = this.run;
    const s = r.stats;
    const wants: Partial<Record<ConsumableId, boolean>> = {
      potion_heal: needsHeal(r) || (r.hp <= s.maxHp * 0.4 && r.consumables.potion_heal > 0),
      potion_regen: needsRegen(r),
      artifact: worthArtifact(r),
    };
    this.slots.forEach((sl) => {
      const on = !!wants[sl.id];
      sl.hint.setVisible(on);
      if (on && !sl.hintTween) {
        sl.hintTween = this.tweens.add({ targets: sl.hint, alpha: { from: 0.4, to: 1 }, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      } else if (!on && sl.hintTween) {
        sl.hintTween.stop();
        sl.hintTween = undefined;
      }
    });
  }

  // ------------------------------------------------------------------------------ карты

  private buildCard(card: Card, cell: number): View {
    const p = cellPos(cell);
    const c = this.add.container(p.x, p.y).setDepth(1);
    let frameKey = 'card_item';
    let spriteKey = '';
    let spriteSize = 112;
    let label = '';
    let labelColor: string = HEX.text;
    switch (card.kind) {
      case 'enemy': {
        const def = ENEMIES[card.defId];
        frameKey = 'card_enemy';
        spriteKey = def.icon;
        spriteSize = def.boss ? 124 : 108;
        label = tr(def.name);
        if (def.boss) labelColor = HEX.gold;
        break;
      }
      case 'gold': frameKey = 'card_gold'; spriteKey = 'spr_gold'; label = `+${card.value}`; labelColor = HEX.gold; break;
      case 'chest': frameKey = 'card_chest'; spriteKey = 'spr_chest'; label = t('game.chest'); break;
      case 'potion_heal': spriteKey = 'item_potion_heal'; label = t('shop.potion_heal'); break;
      case 'potion_regen': spriteKey = 'item_potion_regen'; label = t('shop.potion_regen'); break;
      case 'artifact': spriteKey = 'item_artifact'; label = t('shop.artifact'); break;
    }
    const frame = this.add.image(0, 0, frameKey);
    const shadow = this.add.ellipse(0, ART_Y + spriteSize / 2 - 6, spriteSize * 0.62, 12, 0x000000, 0.35);
    const sprite = this.add.image(0, ART_Y, spriteKey).setDisplaySize(spriteSize, spriteSize);
    const flash = this.add.image(0, 0, frameKey).setTintFill(0xff2a2a).setAlpha(0.5).setVisible(false);
    c.add([frame, shadow, sprite, flash]);
    const view: View = { c, uid: card.uid, kind: card.kind, cell, frame, sprite, flash, defId: card.defId };
    if (card.kind === 'enemy') {
      view.statusRow = this.add.container(0, -92);
      c.add(view.statusRow);
      c.add(txt(this, 0, LABEL_Y, label, 21, { color: labelColor, maxWidth: CARD_W - 32, strokeThickness: 3 }));
      view.atk = statPill(this, -47, PILL_Y, { w: 84, stat: 'damage', text: String(card.atk) });
      view.hp = statPill(this, 47, PILL_Y, { w: 84, stat: 'health', text: String(card.hp) });
      c.add([view.atk.c, view.hp.c]);
      this.updateStatuses(view, card);
    } else if (card.kind === 'gold') {
      const amount = txt(this, 0, 74, label, 34, { color: labelColor, weight: 900 });
      c.add(amount);
    } else {
      c.add(txt(this, 0, 74, label, 22, { color: labelColor, maxWidth: CARD_W - 32 }));
    }
    return view;
  }

  private buildPlayer(): View {
    const cell = this.run.playerCell;
    const p = cellPos(cell);
    const s = this.run.stats;
    const c = this.add.container(p.x, p.y).setDepth(5);
    const frame = this.add.image(0, 0, 'card_hero');
    const shadow = this.add.ellipse(0, ART_Y + 50, 70, 12, 0x000000, 0.35);
    const sprite = this.add.image(0, ART_Y, `hero_${s.classId}`).setDisplaySize(112, 112);
    const flash = this.add.image(0, 0, 'card_hero').setTintFill(0xff2a2a).setAlpha(0.5).setVisible(false);
    c.add([frame, shadow, sprite, flash]);
    c.add(txt(this, 0, LABEL_Y, t(`class.${s.classId}.name` as TKey), 21, { color: HEX.gold, maxWidth: CARD_W - 32 }));
    const view: View = { c, uid: -1, kind: 'player', cell, frame, sprite, flash, defId: 'player' };
    view.atk = statPill(this, -52, PILL_Y, { w: 70, stat: 'damage', text: String(s.damage) });
    view.hp = statPill(this, 45, PILL_Y, { w: 98, stat: 'health', text: `${this.run.hp}/${s.maxHp}`, fontSize: 18 });
    view.shield = statPill(this, -56, -88, { w: 66, h: 28, stat: 'defense', text: '0', fontSize: 16 });
    view.shield.c.setVisible(false);
    c.add([view.atk.c, view.hp.c, view.shield.c]);
    return view;
  }

  /** Значки состояний над карточкой врага: оглушение, горение, яд, клеймо, связь, приговор. */
  private updateStatuses(view: View, card: Card): void {
    const row = view.statusRow;
    if (!row) return;
    row.removeAll(true);
    const list: Array<[string, number]> = [];
    if (card.stun > 0) list.push(['stun', card.stun]);
    if (card.burn > 0) list.push(['burn', card.burn]);
    if (card.poison > 0) list.push(['poison', card.poison]);
    if (card.mark > 0) list.push(['mark', card.mark]);
    if (card.link) list.push(['link', 0]);
    if (card.vuln > 0) list.push(['vuln', 0]);
    if (!list.length) return;
    const w = 38;
    const gap = 6;
    const total = list.length * w + (list.length - 1) * gap;
    list.forEach(([kind, turns], i) => {
      const x = -total / 2 + w / 2 + i * (w + gap);
      const chip = this.add.container(x, 0);
      chip.add(this.add.image(0, 0, plateTexture(this, w, 30, 1, 'dark', 15)));
      chip.add(this.add.rectangle(0, 13, w - 10, 3, STATUS_TINT[kind] ?? 0xffffff));
      const label = turns > 1 ? `${STATUS_TAG[kind]}${turns}` : STATUS_TAG[kind];
      chip.add(txt(this, 0, -2, label, 17, { weight: 900, strokeThickness: 3, color: `#${(STATUS_TINT[kind] ?? 0xffffff).toString(16).padStart(6, '0')}` }));
      row.add(chip);
    });
  }

  private refreshStatuses(): void {
    for (const v of this.views.values()) {
      if (v.kind !== 'enemy') continue;
      const card = this.run.cards[v.cell];
      if (card) this.updateStatuses(v, card);
    }
  }

  /** Полная перерисовка поля — нужна после «Отката времени». */
  private rebuildBoard(): void {
    for (const v of this.views.values()) v.c.destroy();
    this.views.clear();
    for (let i = 0; i < 9; i++) {
      const card = this.run.cards[i];
      if (!card) continue;
      const v = this.buildCard(card, i);
      this.views.set(card.uid, v);
    }
    const p = cellPos(this.run.playerCell);
    this.playerView.c.setPosition(p.x, p.y);
    this.playerView.cell = this.run.playerCell;
  }

  private viewAt(cell: number): View | undefined {
    for (const v of this.views.values()) if (v.cell === cell) return v;
    return undefined;
  }

  // ------------------------------------------------------------------------------ ввод

  private setupInput(): void {
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (Phaser.Math.Distance.Between(p.x, p.y, p.downX, p.downY) > 24) return;
      const x = p.x - BOARD.x0;
      const y = p.y - BOARD.y0;
      if (x < 0 || y < 0) return;
      const col = Math.floor(x / (CARD_W + BOARD.gap));
      const row = Math.floor(y / (CARD_H + BOARD.gap));
      if (col < 0 || col > 2 || row < 0 || row > 2) return;
      this.onTap(row * 3 + col);
    });
    const dir = (dx: number, dy: number): void => {
      const pc = this.run.playerCell;
      const col = (pc % 3) + dx;
      const row = Math.floor(pc / 3) + dy;
      if (col < 0 || col > 2 || row < 0 || row > 2) return;
      this.onTap(row * 3 + col);
    };
    const kb = this.input.keyboard;
    kb?.on('keydown-UP', () => dir(0, -1));
    kb?.on('keydown-W', () => dir(0, -1));
    kb?.on('keydown-DOWN', () => dir(0, 1));
    kb?.on('keydown-S', () => dir(0, 1));
    kb?.on('keydown-LEFT', () => dir(-1, 0));
    kb?.on('keydown-A', () => dir(-1, 0));
    kb?.on('keydown-RIGHT', () => dir(1, 0));
    kb?.on('keydown-D', () => dir(1, 0));
    kb?.on('keydown-ONE', () => this.useItem('potion_heal'));
    kb?.on('keydown-TWO', () => this.useItem('potion_regen'));
    kb?.on('keydown-THREE', () => this.useItem('artifact'));
  }

  private onTap(cell: number): void {
    if (this.busy || this.finished || this.run.over) return;
    const wasArmed = this.run.armed;
    const res = this.run.tap(cell);
    if (!res.ok) {
      if (wasArmed) {
        AUDIO.play('error');
        const v0 = this.viewAt(cell);
        if (v0) this.tweens.add({ targets: v0.c, x: v0.c.x + 8, duration: 50, yoyo: true, repeat: 2 });
        return;
      }
      const v = this.viewAt(cell);
      if (res.reason === 'resource') {
        AUDIO.play('error');
        this.popupAt(this.playerView.c.x, this.playerView.c.y - 100, t('game.no_res', { r: t(`res.${this.run.stats.resource}` as TKey) }), HEX.bad, 22);
        this.tweens.add({ targets: this.resText, alpha: 0.3, duration: 90, yoyo: true, repeat: 2 });
      } else if (res.reason === 'range') {
        AUDIO.play('error');
        if (v) this.tweens.add({ targets: v.c, x: v.c.x + 8, duration: 50, yoyo: true, repeat: 2 });
      }
      return;
    }
    this.clearHand();
    // первое из двух касаний «Перестановки»: ход ещё не сделан
    if (this.run.armed) {
      AUDIO.play('click');
      this.highlightTargets();
      return;
    }
    this.busy = true;
    void this.playEvents(res.events).then(() => {
      this.busy = false;
      this.afterTurn();
    });
  }

  private useItem(id: ConsumableId, auto = false): void {
    if (this.busy || this.finished || this.run.over) return;
    const sl = this.slots.find((s) => s.id === id);
    if (sl?.locked) {
      if (!auto) AUDIO.play('error');
      return;
    }
    const res = this.run.useItem(id);
    if (!res.ok) {
      if (auto) return;
      AUDIO.play('error');
      if (id === 'potion_heal' && this.run.hp >= this.run.stats.maxHp) this.popupAt(this.playerView.c.x, this.playerView.c.y - 90, t('game.hp_full'), HEX.textDim, 22);
      return;
    }
    if (auto && sl) {
      // автоприменение заметно: слот «подпрыгивает», над героем появляется метка «Авто»
      this.tweens.add({ targets: sl.c, scale: 1.16, duration: 170, yoyo: true });
      this.popupAt(this.playerView.c.x, this.playerView.c.y - 96, t('auto.used'), HEX.gold, 22);
    }
    this.busy = true;
    void this.playEvents(res.events).then(() => {
      this.busy = false;
      // не больше одного автоприменения за ход: расходники не сгорают цепочкой
      this.afterTurn(auto);
    });
  }

  /** Автоприменение: после хода (с короткой паузой, чтобы игрок успел заметить) применяет то, что действительно нужно. */
  private tryAutoUse(): boolean {
    const id = pickAutoUse(this.run, Store.autoUse);
    if (!id) return false;
    this.busy = true;
    this.time.delayedCall(320, () => {
      this.busy = false;
      if (!this.alive || this.finished || this.run.over) return;
      this.useItem(id, true);
    });
    return true;
  }

  // ------------------------------------------------------------------------------ проигрывание событий

  private sleep(ms: number): Promise<void> {
    return new Promise((res) => this.time.delayedCall(ms, res));
  }

  private tw(cfg: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
    return new Promise((res) => this.tweens.add({ ...cfg, onComplete: () => res() }));
  }

  private async playEvents(events: GameEvent[]): Promise<void> {
    for (const ev of events) {
      if (!this.alive) return;
      await this.handle(ev);
    }
    await this.lungeDone;
    if (this.alive) this.syncProfile();
  }

  private syncProfile(): void {
    Store.data.consumables = { ...this.run.consumables };
    Store.save();
  }

  private async handle(ev: GameEvent): Promise<void> {
    switch (ev.type) {
      case 'spawn': {
        const v = this.buildCard(ev.card, ev.cell);
        this.views.set(ev.card.uid, v);
        v.c.setScale(0);
        void this.tw({ targets: v.c, scale: 1, duration: TIMING.cardSpawn, ease: 'Back.easeOut' });
        if (this.initialSpawn) {
          AUDIO.play('spawn');
          await this.sleep(70);
        }
        break;
      }
      case 'attack': {
        if (ev.by === 'player') {
          if (ev.ranged) await (ev.style === 'backstab' ? this.backstab(ev.to) : this.shoot(ev.to));
          else await this.lunge(this.playerView, ev.to);
        } else {
          const v = this.viewAt(ev.from);
          if (v) await this.lunge(v, ev.to);
        }
        break;
      }
      case 'hit': {
        const v = ev.target === 'player' ? this.playerView : this.viewAt(ev.cell);
        const p = cellPos(ev.cell);
        if (ev.absorbed) {
          this.popupAt(p.x, p.y - 30, t('game.absorbed'), '#7fc4ff', 28);
          break;
        }
        this.popupAt(p.x, p.y - 30, `-${ev.amount}`, ev.crit ? HEX.gold : HEX.bad, ev.crit ? 46 : 36);
        if (ev.crit) this.popupAt(p.x, p.y - 80, t('game.crit'), HEX.gold, 26);
        AUDIO.play(ev.target === 'player' ? 'hurt' : ev.crit ? 'crit' : 'hit');
        if (v) {
          if (ev.target === 'player') {
            this.setPlayerHp(ev.hp);
            this.cameras.main.shake(140, 0.006);
          } else if (v.hp) {
            v.hp.setText(String(ev.hp));
          }
          this.blink(v);
        }
        break;
      }
      case 'miss': {
        const p = cellPos(ev.cell);
        if (ev.kind === 'dodge') {
          AUDIO.play('dodge');
          this.popupAt(p.x, p.y - 40, t('game.dodge'), '#7fe8d0', 32);
          void this.tw({ targets: this.playerView.c, x: this.playerView.c.x + 26, duration: 90, yoyo: true });
        } else if (ev.kind === 'parry') {
          AUDIO.play('parry');
          this.popupAt(p.x, p.y - 40, t('game.parry'), '#9ec5ff', 32);
        } else if (ev.kind === 'block') {
          AUDIO.play('parry');
          this.popupAt(p.x, p.y - 40, t('game.block'), '#7fc4ff', 30);
        } else if (ev.kind === 'evade') {
          AUDIO.play('dodge');
          this.popupAt(p.x, p.y - 40, t('game.evade'), HEX.textDim, 28);
        } else if (ev.kind === 'stun') {
          this.popupAt(p.x, p.y - 40, t('game.stunned'), '#ffd86b', 26);
        } else {
          this.popupAt(p.x, p.y - 40, t('game.smoke'), HEX.textDim, 26);
        }
        break;
      }
      case 'kill': {
        const v = this.views.get(ev.uid);
        if (v) {
          this.views.delete(ev.uid);
          AUDIO.play('kill');
          this.burst(v.c.x, v.c.y, 0xffffff);
          void this.tw({ targets: v.c, scale: 0.2, alpha: 0, angle: 12, duration: 200, ease: 'Quad.easeIn' }).then(() => v.c.destroy());
        }
        break;
      }
      case 'move': {
        await this.lungeDone;
        const to = cellPos(ev.to);
        const target = this.viewAt(ev.to);
        if (target && target.kind !== 'enemy') {
          this.views.delete(target.uid);
          void this.tw({ targets: target.c, scale: 0.3, alpha: 0, duration: 160 }).then(() => target.c.destroy());
        }
        AUDIO.play('move');
        await this.tw({ targets: this.playerView.c, x: to.x, y: to.y, duration: TIMING.cardMove, ease: 'Quad.easeOut' });
        this.playerView.cell = ev.to;
        break;
      }
      case 'slide': {
        const v = this.views.get(ev.uid);
        if (v) {
          v.cell = ev.to;
          const to = cellPos(ev.to);
          await this.tw({ targets: v.c, x: to.x, y: to.y, duration: TIMING.cardMove, ease: 'Quad.easeOut' });
        }
        break;
      }
      case 'gold': {
        // Золото копится в сумке и попадёт в кошелёк только после победы в комнате.
        this.pouch += ev.amount;
        this.loot.setValues(this.pouch, this.runSouls);
        const p = cellPos(ev.cell);
        this.popupAt(p.x, p.y + 6, `+${ev.amount}`, HEX.gold, 32);
        const dst = this.loot.iconWorld('gold');
        this.fly('ico_gold', p.x, p.y, dst.x, dst.y, Math.min(6, Math.ceil(ev.amount / 8)));
        AUDIO.play('coin');
        break;
      }
      case 'souls': {
        Store.addSouls(ev.amount);
        this.runSouls += ev.amount;
        this.loot.setValues(this.pouch, this.runSouls);
        const p = cellPos(ev.cell);
        this.popupAt(p.x, p.y + 46, `+${ev.amount}`, HEX.soul, 26);
        const dst = this.loot.iconWorld('souls');
        this.fly('ico_soul', p.x, p.y, dst.x, dst.y, Math.min(5, Math.ceil(ev.amount / 6)));
        break;
      }
      case 'heal': {
        this.setPlayerHp(ev.hp);
        const p = this.playerView.c;
        this.popupAt(p.x, p.y - 30, `+${ev.amount}`, HEX.good, 36);
        if (ev.source === 'potion' || ev.source === 'revive') AUDIO.play('potion');
        break;
      }
      case 'resource': this.refreshHud(); break;
      case 'shield': {
        const sh = this.playerView.shield!;
        sh.c.setVisible(ev.now > 0);
        sh.setText(String(ev.now));
        break;
      }
      case 'chest': {
        AUDIO.play('chest');
        const p = cellPos(ev.cell);
        this.burst(p.x, p.y, 0xf1c40f, 18);
        this.lootPop(ev.cell, ev.loot);
        Store.bump('chestsOpened');
        break;
      }
      case 'pickup': {
        const p = cellPos(ev.cell);
        const sl = this.slots.find((s) => s.id === ev.item)!;
        this.fly(CONSUMABLES[ev.item].icon, p.x, p.y, sl.c.x, sl.c.y, 1);
        this.tweens.add({ targets: sl.c, scale: 1.12, duration: 140, delay: 500, yoyo: true });
        AUDIO.play('potion');
        this.refreshHud();
        break;
      }
      case 'break': {
        AUDIO.play('break');
        this.popupAt(this.playerView.c.x, this.playerView.c.y - 100, t('game.broken'), HEX.bad, 28);
        Store.bump('itemsBroken');
        this.refreshHud();
        this.playerView.atk?.setText(String(this.run.stats.damage));
        break;
      }
      case 'perk': {
        AUDIO.play('burst');
        const def = PERK_BY_ID[ev.id];
        this.popupAt(GAME_W / 2, 1120, perkName(def), HEX.gold, 30);
        break;
      }
      case 'armed': {
        this.refreshPerkRow();
        this.highlightTargets();
        break;
      }
      case 'spend': {
        this.pouch = Math.max(0, this.pouch - ev.amount);
        this.loot.setValues(this.pouch, this.runSouls);
        this.popupAt(this.playerView.c.x, this.playerView.c.y - 70, `-${ev.amount}`, HEX.bad, 28);
        AUDIO.play('coin');
        break;
      }
      case 'status': {
        const v = this.views.get(ev.uid);
        const card = this.run.cards[ev.cell];
        if (v && card) this.updateStatuses(v, card);
        break;
      }
      case 'fx': {
        await this.playFx(ev.cells, ev.style);
        break;
      }
      case 'swap': {
        const va = this.viewAt(ev.a);
        const vb = this.viewAt(ev.b);
        const pa = cellPos(ev.a);
        const pb = cellPos(ev.b);
        AUDIO.play('move');
        if (va) va.cell = ev.b;
        if (vb) vb.cell = ev.a;
        await Promise.all([
          va ? this.tw({ targets: va.c, x: pb.x, y: pb.y, duration: TIMING.cardMove, ease: 'Quad.easeInOut' }) : Promise.resolve(),
          vb ? this.tw({ targets: vb.c, x: pa.x, y: pa.y, duration: TIMING.cardMove, ease: 'Quad.easeInOut' }) : Promise.resolve(),
        ]);
        break;
      }
      case 'rewind': {
        AUDIO.play('burst');
        this.cameras.main.flash(260, 150, 120, 255);
        this.rebuildBoard();
        this.popupAt(GAME_W / 2, 1120, t('game.rewind'), HEX.soul, 30);
        await this.sleep(200);
        break;
      }
      case 'artifact': {
        AUDIO.play('burst');
        this.cameras.main.flash(220, 180, 120, 255);
        this.cameras.main.shake(260, 0.01);
        await this.sleep(250);
        break;
      }
      case 'boost': this.refreshHud(); break;
      case 'win': case 'lose': break;
    }
  }

  /** Визуальные эффекты способностей: луч, молния, стрелы, огонь, дым, свет, тьма, удар по земле. */
  private async playFx(cells: number[], style: string): Promise<void> {
    const tint: Record<string, number> = {
      bolt: 0x9ecbff, beam: 0xffe38a, arrows: 0xd8f0a0, fire: 0xff7a2a, shock: 0x7fc4ff,
      smoke: 0x8a8fa8, holy: 0xfff0b0, dark: 0xb287ff, quake: 0xd2a15a, blades: 0xffffff,
    };
    const col = tint[style] ?? 0xffffff;
    AUDIO.play('burst');
    if (style === 'quake') this.cameras.main.shake(260, 0.008);
    if (style === 'holy' || style === 'fire') this.cameras.main.flash(180, (col >> 16) & 255, (col >> 8) & 255, col & 255);
    for (const cell of cells.slice(0, 9)) {
      const p = cellPos(cell);
      if (style === 'beam') {
        const beam = this.add.image(p.x, p.y, 'px').setTint(col).setDepth(78).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(64, 0);
        this.tweens.add({ targets: beam, displayHeight: 1280, alpha: { from: 0.9, to: 0 }, duration: 380, onComplete: () => beam.destroy() });
      } else if (style === 'arrows') {
        const arrow = this.add.image(p.x, p.y - 260, 'spark').setTint(col).setDepth(78).setScale(1.1);
        this.tweens.add({ targets: arrow, y: p.y, alpha: 0, duration: 260, onComplete: () => arrow.destroy() });
      } else if (style === 'smoke') {
        this.smoke(p.x, p.y);
      } else {
        this.burst(p.x, p.y, col, style === 'blades' ? 8 : 14);
      }
    }
    await this.sleep(cells.length ? 220 : 0);
  }

  private setPlayerHp(hp: number): void {
    this.playerView.hp?.setText(`${Math.max(0, hp)}/${this.run.stats.maxHp}`);
    this.playerView.hp?.setTextColor(hp <= this.run.stats.maxHp * 0.3 ? HEX.bad : HEX.white);
  }

  /** Бросок карточки в позицию цели и обратно за 0.35 с; возвращается в момент касания. */
  private async lunge(view: View, toCell: number): Promise<void> {
    await this.lungeDone;
    const from = { x: view.c.x, y: view.c.y };
    const to = cellPos(toCell);
    const depth = view.c.depth;
    view.c.setDepth(60);
    await this.tw({ targets: view.c, x: to.x, y: to.y, duration: TIMING.attackLunge / 2, ease: 'Quad.easeIn' });
    this.lungeDone = this.tw({ targets: view.c, x: from.x, y: from.y, duration: TIMING.attackLunge / 2, ease: 'Quad.easeOut' }).then(() => {
      view.c.setDepth(depth);
    });
  }

  private async shoot(toCell: number): Promise<void> {
    await this.lungeDone;
    const a = this.playerView.c;
    const b = cellPos(toCell);
    const proj = this.add.image(a.x, a.y, 'spark').setDepth(70).setTint(RES_COLOR[this.run.stats.resource]).setScale(1.4);
    this.tweens.add({ targets: a, scale: 1.05, duration: 90, yoyo: true });
    await this.tw({ targets: proj, x: b.x, y: b.y, angle: 360, duration: 200, ease: 'Quad.easeIn' });
    proj.destroy();
  }

  /**
   * Удар в спину (наёмник): герой исчезает в дыму, возникает за спиной цели, бьёт двумя росчерками и возвращается на своё место.
   * Как и бросок, завершается в момент касания — возврат идёт в фоне (lungeDone).
   */
  private async backstab(toCell: number): Promise<void> {
    await this.lungeDone;
    const v = this.playerView.c;
    const a = { x: v.x, y: v.y };
    const b = cellPos(toCell);
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const dx = (b.x - a.x) / len;
    const dy = (b.y - a.y) / len;
    // «за спиной» — с дальней от героя стороны цели; карточка героя не выходит за края экрана
    const behind = {
      x: Phaser.Math.Clamp(b.x + dx * 96, CARD_W / 2 + 4, GAME_W - CARD_W / 2 - 4),
      y: Phaser.Math.Clamp(b.y + dy * 96, 300, 900),
    };
    const depth = v.depth;
    v.setDepth(60);
    AUDIO.play('dodge');
    this.smoke(a.x, a.y);
    await this.tw({ targets: v, alpha: 0, scale: 0.7, duration: 110, ease: 'Quad.easeIn' });
    v.setPosition(behind.x, behind.y);
    this.smoke(behind.x, behind.y);
    // за спиной герой чуть меньше — цель остаётся видна
    await this.tw({ targets: v, alpha: 1, scale: 0.8, duration: 120, ease: 'Back.easeOut' });
    // два скрещённых росчерка на цели
    const ang = Phaser.Math.RadToDeg(Math.atan2(dy, dx)) + 90;
    this.slash(b.x, b.y, ang - 32, 0);
    this.slash(b.x, b.y, ang + 32, 70);
    this.burst(b.x, b.y, 0xffe38a, 14);
    await this.sleep(90);
    this.lungeDone = (async () => {
      await this.sleep(190);
      if (!v.scene) return;
      this.smoke(v.x, v.y);
      await this.tw({ targets: v, alpha: 0, scale: 0.7, duration: 100, ease: 'Quad.easeIn' });
      v.setPosition(a.x, a.y);
      this.smoke(a.x, a.y);
      await this.tw({ targets: v, alpha: 1, scale: 1, duration: 120, ease: 'Back.easeOut' });
      v.setDepth(depth);
    })();
  }

  /** Тёмный фиолетовый дымок — появление/исчезновение при телепорте. */
  private smoke(x: number, y: number): void {
    const puff = this.add.circle(x, y, 26, 0x1b1230, 0.85).setDepth(65);
    this.tweens.add({ targets: puff, scale: 2.6, alpha: 0, duration: 320, ease: 'Cubic.easeOut', onComplete: () => puff.destroy() });
    this.burst(x, y, 0x8a63ff, 10);
  }

  /** Быстрый белый росчерк клинка. */
  private slash(x: number, y: number, angle: number, delay: number): void {
    const s = this.add.image(x, y, 'px').setDepth(75).setAngle(angle).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(20, 8).setAlpha(0);
    this.tweens.add({
      targets: s, alpha: { from: 1, to: 0 }, displayWidth: 210, displayHeight: 5, delay, duration: 240, ease: 'Cubic.easeOut',
      onComplete: () => s.destroy(),
    });
  }

  /** Damage blink: 0.75 с, интервал 0.25 с. */
  private blink(v: View): void {
    v.flash.setVisible(true);
    v.sprite.setTintFill(0xff5a4a);
    const steps = Math.round(TIMING.blinkTotal / TIMING.blinkInterval);
    for (let i = 1; i <= steps; i++) {
      this.time.delayedCall(i * TIMING.blinkInterval, () => {
        const on = i % 2 === 0 && i < steps;
        if (!v.c.scene) return;
        v.flash.setVisible(on);
        if (on) v.sprite.setTintFill(0xff5a4a);
        else v.sprite.clearTint();
      });
    }
  }

  private popupAt(x: number, y: number, text: string, color: string, size: number): void {
    const p = txt(this, x, y, text, size, { color, weight: 900, strokeThickness: Math.max(5, size / 5) }).setDepth(100);
    p.setScale(0.6);
    this.tweens.add({ targets: p, scale: 1, duration: 140, ease: 'Back.easeOut' });
    this.tweens.add({ targets: p, y: y - 60, alpha: 0, delay: 350, duration: 650, onComplete: () => p.destroy() });
  }

  /** Расходники из сундука «вылетают» рядком над карточкой. */
  private lootPop(cell: number, loot: Loot[]): void {
    const items = loot.filter((l) => l.kind !== 'gold') as Array<{ kind: ConsumableId }>;
    if (!items.length) return;
    const p = cellPos(cell);
    items.forEach((l, i) => {
      const x = p.x + (i - (items.length - 1) / 2) * 76;
      const c = this.add.container(x, p.y - 40).setDepth(110).setScale(0);
      c.add(this.add.image(0, 0, plateTexture(this, 68, 68, 1, 'panel', 22)));
      c.add(this.add.image(0, 0, outlineTexture(this, 68, 68, 22, '#f0c75e', 3)));
      c.add(icon(this, 0, 0, CONSUMABLES[l.kind].icon, 48));
      this.tweens.add({ targets: c, scale: 1, duration: 260, delay: i * 120, ease: 'Back.easeOut' });
      this.tweens.add({ targets: c, y: p.y - 110, alpha: 0, delay: 900 + i * 120, duration: 500, onComplete: () => c.destroy() });
    });
  }

  private burst(x: number, y: number, color: number, n = 10): void {
    for (let i = 0; i < n; i++) {
      const s = this.add.image(x, y, 'px').setTint(color).setDepth(80).setScale(1 + Math.random() * 2);
      const a = Math.random() * Math.PI * 2;
      const d = 40 + Math.random() * 70;
      this.tweens.add({ targets: s, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, duration: 380 + Math.random() * 200, onComplete: () => s.destroy() });
    }
  }

  private fly(key: string, x: number, y: number, tx: number, ty: number, n: number): void {
    for (let i = 0; i < n; i++) {
      const s = this.add.image(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 40, key).setDisplaySize(34, 34).setDepth(90);
      this.tweens.add({
        targets: s, x: tx, y: ty, scale: 0.5, duration: 520 + i * 70, delay: i * 50, ease: 'Cubic.easeIn',
        onComplete: () => s.destroy(),
      });
    }
  }

  // ------------------------------------------------------------------------------ после хода

  private afterTurn(skipAuto = false): void {
    if (!this.alive) return;
    this.refreshHud();
    this.refreshStatuses();
    this.refreshPerkRow();
    this.highlightTargets();
    this.setPlayerHp(this.run.hp);
    this.playerView.atk?.setText(String(this.run.stats.damage));
    if (this.run.over === 'win') {
      void this.finish('win');
      return;
    }
    if (this.run.over === 'lose') {
      // талант «Возвращение» / «Последний шанс»: герой поднимается сам, без рекламы
      const up = this.run.autoRevive();
      if (up) {
        this.busy = true;
        this.popupAt(this.playerView.c.x, this.playerView.c.y - 110, t('game.self_revive'), HEX.good, 28);
        void this.playEvents(up).then(() => {
          this.busy = false;
          this.afterTurn();
        });
        return;
      }
      void this.finish('lose');
      return;
    }
    // подсветка врагов, которых можно добить одним ударом
    for (const v of this.views.values()) {
      if (v.kind !== 'enemy') continue;
      v.frame.setTexture(this.run.wouldKill(v.cell) ? 'card_kill' : 'card_enemy');
    }
    if (!skipAuto && this.tryAutoUse()) return;
    this.updateTutorial();
  }

  // ------------------------------------------------------------------------------ обучение

  private updateTutorial(): void {
    if (Store.data.tutorial.fight || this.finished) return;
    const pc = this.run.playerCell;
    const adj = [pc - 3, pc + 3, pc % 3 > 0 ? pc - 1 : -1, pc % 3 < 2 ? pc + 1 : -1].filter((c) => c >= 0 && c < 9 && this.run.cards[c]);
    if (this.hintStage === 0) {
      const pick = adj.find((c) => this.run.cards[c]!.kind === 'enemy' && this.run.wouldKill(c)) ?? adj.find((c) => this.run.cards[c]!.kind === 'enemy') ?? adj[0];
      this.showHint(t('tut.attack'), pick);
      this.hintStage = 1;
    } else if (this.hintStage === 1) {
      const loot = adj.find((c) => this.run.cards[c]!.kind !== 'enemy');
      if (this.run.totals.kills > 0 && loot !== undefined) {
        this.showHint(t('tut.loot'), loot);
        this.hintStage = 2;
      } else if (this.run.totals.turns > 1) {
        this.showHint(t('tut.finish'));
        this.hintStage = 3;
      }
    } else if (this.hintStage === 2 && this.run.totals.turns > 3) {
      this.showHint(this.perkBtns.length && !Store.data.tutorial.perk ? t('tut.perk') : t('tut.finish'));
      this.hintStage = 3;
    }
  }

  private showHint(text: string, cell?: number): void {
    this.clearHand();
    this.hintText?.destroy();
    this.hintText = txt(this, GAME_W / 2, 963, text, 21, { color: HEX.gold, wrap: 640, align: 'center' }).setDepth(50);
    if (cell !== undefined) {
      const p = cellPos(cell);
      this.hand = tapHint(this, p.x, p.y + 10);
    }
  }

  private clearHand(): void {
    this.hand?.destroy();
    this.hand = undefined;
  }

  // ------------------------------------------------------------------------------ побег и результат

  private askEscape(): void {
    if (this.finished) return;
    new Dialog(this, {
      title: t('game.escape_title'),
      body: this.pouch > 0 ? t('game.escape_warn') : undefined,
      buttons: [
        { label: t('game.escape'), style: 'red', onClick: () => this.leave('Hub') },
        { label: t('common.continue'), style: 'gold' },
      ],
    });
  }

  private leaveRun(): void {
    Store.commitRun(this.run.weapon, this.run.armor, this.run.consumables);
  }

  private async leave(scene: string, data?: object): Promise<void> {
    this.finished = true;
    this.leaveRun();
    Store.flush();
    if (scene !== 'Game' || data) await maybeInterstitial();
    fadeToScene(this, scene, scene === 'Hub' ? { from: 'game' } : data);
  }

  private async finish(result: 'win' | 'lose'): Promise<void> {
    this.finished = true;
    YSDK.gameplayStop();
    const run = this.run;
    const room = run.room;
    this.leaveRun();
    let bonusGold = 0;
    let bonusSouls = 0;
    let first = false;
    const flawless = result === 'win' && run.totals.damageTaken === 0;
    if (result === 'win') {
      first = Store.markCleared(room.id);
      Store.bump('roomsCleared');
      if (flawless) Store.bump('flawless');
      bonusGold = first ? room.clearGold : Math.round(room.clearGold * 0.25);
      bonusSouls = first ? room.clearSouls : 0;
      // Сумка с золотом сдаётся в кошелёк только за победу.
      Store.addGold(run.totals.gold + bonusGold);
      if (bonusSouls) Store.addSouls(bonusSouls);
      void YSDK.submitScore('rooms', Store.data.cleared.length);
      void YSDK.setStats({ rooms: Store.data.cleared.length, kills: Store.data.stats.kills });
    } else {
      Store.bump('deaths');
    }
    Store.bump('kills', run.totals.kills);
    Store.data.tutorial.fight = true;
    // Автопрокачка: заработанные души сразу уходят в выбранную ветку дерева (если включено).
    this.autoNote = Store.runAutoSkill()?.buys.length ?? 0;
    Store.checkNow();
    Store.flush();
    this.clearHand();
    this.hintText?.destroy();

    AUDIO.play(result === 'win' ? 'win' : 'lose');
    await this.sleep(result === 'win' ? 700 : 500);
    if (!this.alive) return;

    this.resultInfo = {
      result, first, flawless,
      totalGold: result === 'win' ? run.totals.gold + bonusGold : 0,
      totalSouls: run.totals.souls + bonusSouls,
    };
    this.showResult();
  }

  private showResult(): void {
    const run = this.run;
    const room = run.room;
    const { result, first, flawless, totalGold, totalSouls } = this.resultInfo!;
    if (this.autoNote > 0) {
      toast(this, t('auto.skill.result', { n: this.autoNote }), 'ico_soul');
      this.autoNote = 0;
    }
    const idx = ROOMS.findIndex((r) => r.id === room.id);
    const next = ROOMS[idx + 1];
    const canNext = result === 'win' && !!next && Store.isRoomAvailable(next.id);
    const buttons: DialogBtn[] = [];
    let doubled = false;
    let doubleBtn: PlateButton | undefined;

    if (result === 'win') {
      buttons.push({
        label: t('game.double'), icon: 'svg_video', style: 'green', keep: true,
        ref: (b) => (doubleBtn = b),
        onClick: () => {
          if (doubled) return;
          void watchRewarded().then((ok) => {
            if (!ok) return;
            doubled = true;
            Store.addGold(totalGold);
            Store.addSouls(totalSouls);
            Store.flush();
            toast(this, t('toast.reward'));
            doubleBtn?.setLocked(true).setLabel(t('toast.reward'));
            doubleBtn?.iconImg?.setVisible(false);
          });
        },
      });
      buttons.push({ label: canNext ? t('game.next_room') : t('game.replay'), style: 'gold', onClick: () => void this.leave('Game', { roomId: canNext ? next!.id : room.id }) });
    } else {
      if (!run.revived) {
        buttons.push({
          label: t('game.revive'), icon: 'svg_video', style: 'green',
          onClick: () => {
            void watchRewarded().then((ok) => {
              if (!ok) {
                this.showResult();
                return;
              }
              this.finished = false;
              this.busy = true;
              YSDK.gameplayStart();
              void this.playEvents(this.run.revive()).then(() => {
                this.busy = false;
                this.afterTurn();
              });
            });
          },
        });
      }
      buttons.push({ label: t('game.replay'), style: 'gold', onClick: () => void this.leave('Game', { roomId: room.id }) });
    }
    buttons.push({ label: t('game.to_hub'), style: 'raised', onClick: () => void this.leave('Hub') });

    new Dialog(this, {
      title: result === 'win' ? t('game.win') : t('game.lose'),
      titleColor: result === 'win' ? HEX.gold : HEX.bad,
      vertical: true,
      width: 620,
      content: (s, c) => {
        let y = 6;
        const row = (key: string, text: string, color: string): void => {
          const label = txt(s, 0, y + 28, text, 40, { color, weight: 900, origin: [0, 0.5] });
          const total = 52 + 14 + label.width;
          c.add(s.add.image(-total / 2 + 26, y + 28, key).setDisplaySize(52, 52));
          label.setX(-total / 2 + 66);
          c.add(label);
          y += 62;
        };
        if (result === 'win') row('ico_gold', `+${fmt(totalGold)}`, HEX.gold);
        if (totalSouls > 0) row('ico_soul', `+${fmt(totalSouls)}`, HEX.soul);
        if (result === 'lose') {
          c.add(txt(s, 0, y + 12, t('game.gold_lost'), 24, { color: HEX.bad, strokeThickness: 0 }));
          y += 34;
          if (totalSouls > 0) {
            c.add(txt(s, 0, y + 8, t('game.souls_kept'), 22, { color: HEX.textDim, strokeThickness: 0, weight: 700 }));
            y += 30;
          }
        }
        if (first) {
          c.add(txt(s, 0, y + 12, t('game.first_clear'), 24, { color: HEX.good, strokeThickness: 0 }));
          y += 36;
        }
        if (flawless) {
          c.add(txt(s, 0, y + 12, t('game.flawless'), 24, { color: HEX.gold, strokeThickness: 0 }));
          y += 36;
        }
        return y + 4;
      },
      buttons,
    });
  }
}

