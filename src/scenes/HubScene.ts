import Phaser from 'phaser';
import { COLOR, GAME_W, HEX, TIMING } from '../config';
import { ITEMS } from '../data/items';
import { ROOM_BY_ID, ROOMS, ROOMS_PER_FLOOR } from '../data/levels';
import { Store } from '../systems/Store';
import { AUDIO } from '../systems/Audio';
import { YSDK } from '../sdk/YandexSDK';
import { fmtTime, t } from '../i18n';
import type { TKey } from '../i18n';
import { anyAffordable, TREES } from '../logic/skillTree';
import {
  addEmbers, background, bindToasts, CurrencyBar, dollyIn, fadeToScene, PlateButton, plateTexture, shadowTexture, soundButton, tapHint,
  toast, txt, zoomIn, zoomOut, type ZoomFrom,
} from '../ui/Kit';
import { createHeroCard, HERO_H, HERO_W, type HeroCard } from '../ui/HeroCard';
import { openDailyReward, openGift } from '../ui/Popups';

/** Раскладка главного экрана: две ровные колонки, карточка комнаты и «Играть». Меню «вырастают» из этих прямоугольников. */
export const HUB = {
  logo: { x: 32, y: 64 },
  trophy: { x: 396, y: 64, size: 64 },
  sound: { x: 476, y: 64, size: 64 },
  currency: { x: 688, y: 44 },
  hero: { x: 164, y: 486 },
  shop: { x: 504, y: 228, w: 368, h: 156 },
  levels: { x: 504, y: 372, w: 368, h: 100 },
  settings: { x: 504, y: 488, w: 368, h: 100 },
  gift: { x: 504, y: 629, w: 368, h: 118 },
  daily: { x: 504, y: 763, w: 368, h: 118 },
  room: { x: 360, y: 918, w: 656, h: 104 },
  play: { x: 360, y: 1078, w: 656, h: 128 },
} as const;

/** Карточка героя в лавке: слева, по центру высоты. */
export const SHOP_HERO = { x: 110, y: 640, scale: 0.62 } as const;

export const rectOf = (b: { x: number; y: number; w: number; h: number }): ZoomFrom => ({ x: b.x, y: b.y, w: b.w, h: b.h });

interface HubData {
  from?: 'shop' | 'levels' | 'settings' | 'skill' | 'ach' | 'game';
}

export class HubScene extends Phaser.Scene {
  private hero!: HeroCard;
  private fromMenu?: HubData['from'];
  private busy = false;
  private giftBtn?: PlateButton;
  private dailyBtn?: PlateButton;
  private shopBtn?: PlateButton;
  private items: Phaser.GameObjects.GameObject[] = [];
  private hints: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('Hub');
  }

  init(data: HubData = {}): void {
    this.fromMenu = data.from;
    this.busy = false;
    this.items = [];
    this.hints = [];
    // Поля живут дольше сцены: обнуляем ссылки на кнопки прошлого запуска.
    this.shopBtn = undefined;
    this.giftBtn = undefined;
    this.dailyBtn = undefined;
  }

  create(): void {
    YSDK.ready();
    YSDK.gameplayStop();
    background(this);
    addEmbers(this, 12);
    bindToasts(this);
    // из меню возвращаемся через «окно», сжимающееся в кнопку; из боя и при запуске — мягкое «наезжание» камеры
    if (!this.fromMenu || this.fromMenu === 'game') dollyIn(this, 360);

    // Автопрокачка: души, заработанные в башне, сразу уходят в выбранную ветку (если игрок это включил).
    const auto = Store.runAutoSkill();
    if (auto?.buys.length) this.time.delayedCall(700, () => toast(this, t('auto.skill.result', { n: auto.buys.length }), 'ico_soul'));

    // --- верхняя панель: логотип, достижения, звук, валюта
    const logo = txt(this, HUB.logo.x, HUB.logo.y, 'EVIL TOWER 2', 30, { font: 'title', origin: [0, 0.5], color: HEX.gold, strokeThickness: 5 });
    // Название растянуто вплоть до иконки достижений (с небольшим зазором).
    const logoMax = HUB.trophy.x - HUB.trophy.size / 2 - 16 - HUB.logo.x;
    let logoSize = Math.min(64, Math.floor((30 * logoMax) / logo.width));
    logo.setFontSize(logoSize).setStroke(HEX.dark, Math.max(5, Math.round(logoSize / 7)));
    while (logo.width > logoMax && logoSize > 24) logo.setFontSize(--logoSize);
    const trophy = new PlateButton(this, HUB.trophy.x, HUB.trophy.y, {
      w: HUB.trophy.size, h: HUB.trophy.size, icon: 'svg_trophy', iconSize: 34, radius: 18,
      onClick: () => this.openMenu('Achievements', { x: HUB.trophy.x, y: HUB.trophy.y, w: HUB.trophy.size, h: HUB.trophy.size }),
    });
    const sound = soundButton(this, HUB.sound.x, HUB.sound.y, HUB.sound.size);
    const cur = new CurrencyBar(this, HUB.currency.x, HUB.currency.y);
    this.items.push(logo, trophy, sound, cur);

    // --- карточка персонажа (нажатие открывает skill-tree)
    const fromShop = this.fromMenu === 'shop';
    this.hero = createHeroCard(this, HUB.hero.x, HUB.hero.y, true);
    this.hero.hitArea.setInteractive({ useHandCursor: true });
    this.hero.hitArea.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (Phaser.Math.Distance.Between(p.x, p.y, p.downX, p.downY) > 20) return;
      AUDIO.play('click');
      this.openMenu('SkillTree', { x: HUB.hero.x, y: HUB.hero.y, w: HERO_W, h: HERO_H });
    });
    this.items.push(this.hero.root);

    // --- навигация справа
    const nextRoom = ROOM_BY_ID[Store.frontierRoom];
    this.shopBtn = new PlateButton(this, HUB.shop.x, HUB.shop.y, {
      w: HUB.shop.w, h: HUB.shop.h, label: t('hub.shop'), font: 'title', fontSize: 52, sub: t('hub.shop_sub'),
      pulse: { cycle: TIMING.uiPulseCycle, scale: TIMING.uiPulseScale }, radius: 30, onClick: () => this.openShop(),
    });
    const levels = new PlateButton(this, HUB.levels.x, HUB.levels.y, {
      w: HUB.levels.w, h: HUB.levels.h, label: t('hub.levels'), font: 'title', fontSize: 38, sub: t('game.room', { r: nextRoom.id }), radius: 26,
      onClick: () => this.openMenu('Levels', rectOf(HUB.levels)),
    });
    const settings = new PlateButton(this, HUB.settings.x, HUB.settings.y, {
      w: HUB.settings.w, h: HUB.settings.h, label: t('hub.settings'), font: 'title', fontSize: 38, radius: 26,
      onClick: () => this.openMenu('Settings', rectOf(HUB.settings)),
    });
    this.items.push(this.shopBtn, levels, settings);
    this.refreshBadges();

    // --- подарки
    this.giftBtn = new PlateButton(this, HUB.gift.x, HUB.gift.y, {
      w: HUB.gift.w, h: HUB.gift.h, label: t('hub.gift'), fontSize: 27, sub: '', icon: 'item_artifact', iconSize: 60, style: 'green', radius: 28,
      onClick: () => (Store.giftReady() ? openGift(this, () => this.refreshGifts()) : undefined),
    });
    this.dailyBtn = new PlateButton(this, HUB.daily.x, HUB.daily.y, {
      w: HUB.daily.w, h: HUB.daily.h, label: t('hub.daily'), fontSize: 27, sub: '', icon: 'svg_gift', iconSize: 44, radius: 28,
      onClick: () => openDailyReward(this, () => this.refreshGifts()),
    });
    this.items.push(this.giftBtn, this.dailyBtn);
    this.refreshGifts();
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.refreshGifts() });

    // --- комната, прогресс и «Играть»
    this.buildRoomInfo();
    const glow = this.add.image(HUB.play.x, HUB.play.y, 'glow').setTint(COLOR.gold).setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(HUB.play.w + 120, HUB.play.h + 150).setAlpha(0);
    this.tweens.add({ targets: glow, alpha: { from: 0.1, to: 0.32 }, delay: 500, duration: TIMING.playPulseCycle / 2, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const play = new PlateButton(this, HUB.play.x, HUB.play.y, {
      w: HUB.play.w, h: HUB.play.h, label: t('hub.play'), font: 'title', fontSize: 62, style: 'gold', radius: 36,
      pulse: { cycle: TIMING.playPulseCycle, scale: TIMING.playPulseScale }, onClick: () => this.play(),
    });
    glow.setDepth(-1);
    this.items.push(play);

    this.buildHints();
    this.input.keyboard?.on('keydown-ENTER', () => this.play());
    this.input.keyboard?.on('keydown-SPACE', () => this.play());

    // --- вход: меню «сжимается» в свою кнопку, остальное плавно проявляется
    if (this.fromMenu && this.fromMenu !== 'game') {
      const map: Record<string, ZoomFrom> = {
        shop: rectOf(HUB.shop),
        levels: rectOf(HUB.levels),
        settings: rectOf(HUB.settings),
        skill: { x: HUB.hero.x, y: HUB.hero.y, w: HERO_W, h: HERO_H },
        ach: { x: HUB.trophy.x, y: HUB.trophy.y, w: HUB.trophy.size, h: HUB.trophy.size },
      };
      zoomIn(this, map[this.fromMenu]);
    }
    this.items.forEach((o, i) => this.introIn(o, fromShop ? 0 : i * 30));

    // Ежедневная награда — при возвращении в игру (после первого улучшения, чтобы не перебивать обучение).
    if (Store.data.tutorial.skill && Store.dailyStatus().available && (!this.fromMenu || this.fromMenu === 'game')) {
      this.time.delayedCall(700, () => openDailyReward(this, () => this.refreshGifts()));
    }
  }

  private introIn(o: Phaser.GameObjects.GameObject, delay = 0): void {
    const g = o as Phaser.GameObjects.Container;
    if (!g.scene) return;
    const y = g.y;
    g.setAlpha(0);
    g.y = y + 18;
    this.tweens.add({ targets: g, alpha: 1, y, duration: 380, delay: 60 + delay, ease: 'Cubic.easeOut' });
  }

  private refreshBadges(): void {
    const ls = Store.activeLineageSave;
    this.hero.badge.setVisible(anyAffordable(TREES[Store.activeLineage], ls, Store.souls));
    this.shopBtn?.setBadge(this.shopHasAffordable());
  }

  private shopHasAffordable(): boolean {
    const w = Store.equipped('weapon');
    const a = Store.equipped('armor');
    const lin = Store.activeLineage;
    const wt = w ? ITEMS.find((i) => i.id === w.id)!.tier : 0;
    const at = a ? ITEMS.find((i) => i.id === a.id)!.tier : 0;
    return ITEMS.some((i) => {
      if (i.slot === 'weapon') return i.lineage === lin && i.tier === wt + 1 && Store.gold >= i.price;
      return i.tier === at + 1 && Store.gold >= i.price;
    });
  }

  private refreshGifts(): void {
    if (!this.giftBtn?.scene || !this.dailyBtn?.scene) return;
    const ready = Store.giftReady();
    this.giftBtn.setBadge(ready);
    this.giftBtn.setSub(ready ? t('common.claim') : fmtTime(Store.giftRemainingMs()));
    this.giftBtn.setLocked(!ready);
    const daily = Store.dailyStatus();
    this.dailyBtn.setBadge(daily.available);
    this.dailyBtn.setSub(daily.available ? t('daily.day', { n: daily.dayIndex + 1 }) : t('daily.tomorrow_short'));
  }

  private buildRoomInfo(): void {
    const id = Store.frontierRoom;
    const room = ROOM_BY_ID[id];
    const r = HUB.room;
    const c = this.add.container(r.x, r.y);
    c.add(this.add.image(0, 8, shadowTexture(this, r.w, r.h, 28, 18)).setAlpha(0.85));
    c.add(this.add.image(0, 0, plateTexture(this, r.w, r.h, 1, 'panel', 28)));
    const left = -r.w / 2 + 32;
    c.add(txt(this, left, -22, t(`floor.${room.floor}.name` as TKey).toUpperCase(), 19, { origin: [0, 0.5], color: HEX.textMute, weight: 800, strokeThickness: 0 }));
    c.add(txt(this, left, 8, t('game.room', { r: id }), 36, { font: 'title', origin: [0, 0.5], color: HEX.gold, strokeThickness: 0 }));
    const cleared = Store.clearedOf().length;
    c.add(txt(this, r.w / 2 - 32, -6, `${cleared} / ${ROOMS.length}`, 26, { origin: [1, 0.5], color: HEX.textDim, weight: 800, strokeThickness: 0 }));
    // прогресс башни: три этажа
    const bw = r.w - 64;
    const by = 36;
    c.add(this.add.image(0, by, plateTexture(this, bw, 12, 1, 'dark', 6)));
    const fillW = Math.max(12, (bw * cleared) / ROOMS.length);
    if (cleared > 0) c.add(this.add.image(-bw / 2 + fillW / 2, by, plateTexture(this, fillW, 12, 1, 'gold', 6)));
    for (let f = 1; f < ROOMS.length / ROOMS_PER_FLOOR; f++) {
      c.add(this.add.image(-bw / 2 + (bw * f) / (ROOMS.length / ROOMS_PER_FLOOR), by, 'px').setTint(0xffffff).setAlpha(0.28).setDisplaySize(2, 12));
    }
    this.items.push(c);
  }

  private buildHints(): void {
    const tut = Store.data.tutorial;
    if (tut.fight && !tut.skill && Store.souls >= 10) {
      this.hints.push(txt(this, GAME_W / 2, 118, t('tut.hub_skill'), 24, { color: HEX.gold, wrap: 640 }), tapHint(this, HUB.hero.x, HUB.hero.y + 30));
    } else if (tut.fight && tut.skill && !tut.hub) {
      // после первого улучшения — только «палец» у «Играть», без лозунга
      this.hints.push(tapHint(this, HUB.play.x + 200, HUB.play.y));
    }
  }

  private lock(): boolean {
    if (this.busy) return false;
    this.busy = true;
    return true;
  }

  private openShop(): void {
    if (!this.lock()) return;
    this.items.filter((o) => o !== this.shopBtn).forEach((o) => this.tweens.add({ targets: o, alpha: 0, duration: 200 }));
    this.hints.forEach((h) => (h as Phaser.GameObjects.Text).setVisible(false));
    zoomOut(this, rectOf(HUB.shop), 'Shop');
  }

  private openMenu(scene: string, from: ZoomFrom): void {
    if (!this.lock()) return;
    zoomOut(this, from, scene);
  }

  private play(): void {
    if (!this.lock()) return;
    AUDIO.play('open');
    if (Store.data.tutorial.skill) Store.data.tutorial.hub = true;
    // «Играть» всегда ведёт в новейшую открытую комнату; старые комнаты запускаются из «Уровней».
    fadeToScene(this, 'Game', { roomId: Store.frontierRoom });
  }
}
