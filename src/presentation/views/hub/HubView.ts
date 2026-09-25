import Phaser from 'phaser';

import type { GiftState } from '../../../application/hub/interfaces/GiftState';
import type { HubHint } from '../../../application/hub/interfaces/HubHint';
import type { HubRecord } from '../../../application/hub/interfaces/HubRecord';
import type { IHubView } from '../../../application/hub/interfaces/IHubView';
import type { DailyStatus } from '../../../domain/logic/profile';
import { fmtTime, t, type TKey } from '../../../i18n';
import {
  addEmbers,
  background,
  CurrencyBar,
  HeroCard,
  PlateButton,
  plateTexture,
  shadowTexture,
  soundButton,
  tapHint,
  toast,
  txt,
  UiSound,
} from '../../components';
import { dollyIn, zoomIn } from '../../navigation/SceneTransitions';
import { COLOR, GAME_W, HEX, TIMING } from '../../theme';
import { HubLayout } from './HubLayout';
import type { HubViewDeps } from './interfaces/HubViewDeps';

/**
 * Главный экран: логотип, достижения, звук и валюта сверху; карточка героя слева; лавка, уровни,
 * настройки и подарки справа; рекорд и «Играть» снизу. Вид только рисует состояние хаба
 * и отдаёт нажатия командами — решает поток хаба (`HubController`).
 */
export class HubView implements IHubView {
  private readonly hero: HeroCard;
  private readonly shopBtn: PlateButton;
  private readonly giftBtn: PlateButton;
  private readonly dailyBtn: PlateButton;
  /** Всё, что проявляется при входе (по порядку). */
  private readonly items: Phaser.GameObjects.GameObject[] = [];
  private readonly hints: Phaser.GameObjects.GameObject[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    d: HubViewDeps,
  ) {
    const L = HubLayout;
    const state = d.state();
    const fromMenu = d.from && d.from !== 'game' ? d.from : undefined;
    background(scene);
    addEmbers(scene, 12);
    // из меню возвращаемся через «окно», сжимающееся в кнопку; из боя и при запуске — мягкое «наезжание» камеры
    if (!fromMenu) dollyIn(scene, 360);

    // --- верхняя панель: логотип, достижения, звук, валюта
    const logo = txt(scene, L.logo.x, L.logo.y, 'EVIL TOWER 2', 30, {
      font: 'title',
      origin: [0, 0.5],
      color: HEX.gold,
      strokeThickness: 5,
    });
    // Название растянуто вплоть до иконки достижений (с небольшим зазором).
    const logoMax = L.trophy.x - L.trophy.size / 2 - 16 - L.logo.x;
    let logoSize = Math.min(64, Math.floor((30 * logoMax) / logo.width));
    logo.setFontSize(logoSize).setStroke(HEX.dark, Math.max(5, Math.round(logoSize / 7)));
    while (logo.width > logoMax && logoSize > 24) logo.setFontSize(--logoSize);
    const trophy = new PlateButton(scene, L.trophy.x, L.trophy.y, {
      w: L.trophy.size,
      h: L.trophy.size,
      icon: 'svg_trophy',
      iconSize: 34,
      radius: 18,
      onClick: () => d.commands({ type: 'open', menu: 'achievements' }),
    });
    const sound = soundButton(scene, L.sound.x, L.sound.y, d.audio, L.sound.size);
    const cur = new CurrencyBar(scene, L.currency.x, L.currency.y, { wallet: d.wallet });
    this.items.push(logo, trophy, sound, cur);

    // --- карточка персонажа (нажатие открывает дерево навыков)
    this.hero = new HeroCard(scene, L.hero.x, L.hero.y, d.hero, true);
    this.hero.hitArea.setInteractive({ useHandCursor: true });
    this.hero.hitArea.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (Phaser.Math.Distance.Between(p.x, p.y, p.downX, p.downY) > 20) return;
      UiSound.play('click');
      d.commands({ type: 'open', menu: 'skill' });
    });
    this.items.push(this.hero.root);

    // --- навигация справа
    this.shopBtn = new PlateButton(scene, L.shop.x, L.shop.y, {
      w: L.shop.w,
      h: L.shop.h,
      label: t('hub.shop'),
      font: 'title',
      fontSize: 52,
      sub: t('hub.shop_sub'),
      pulse: { cycle: TIMING.uiPulseCycle, scale: TIMING.uiPulseScale },
      radius: 30,
      onClick: () => d.commands({ type: 'open', menu: 'shop' }),
    });
    const levels = new PlateButton(scene, L.levels.x, L.levels.y, {
      w: L.levels.w,
      h: L.levels.h,
      label: t('hub.levels'),
      font: 'title',
      fontSize: 38,
      sub: t('hub.next', { r: `${state.record.cleared} / ${state.record.total}` }),
      radius: 26,
      onClick: () => d.commands({ type: 'open', menu: 'levels' }),
    });
    const settings = new PlateButton(scene, L.settings.x, L.settings.y, {
      w: L.settings.w,
      h: L.settings.h,
      label: t('hub.settings'),
      font: 'title',
      fontSize: 38,
      radius: 26,
      onClick: () => d.commands({ type: 'open', menu: 'settings' }),
    });
    this.items.push(this.shopBtn, levels, settings);
    this.hero.badge.setVisible(state.skillBadge);
    this.shopBtn.setBadge(state.shopBadge);

    // --- подарки
    this.giftBtn = new PlateButton(scene, L.gift.x, L.gift.y, {
      w: L.gift.w,
      h: L.gift.h,
      label: t('hub.gift'),
      fontSize: 27,
      sub: '',
      icon: 'item_artifact',
      iconSize: 60,
      style: 'green',
      radius: 28,
      onClick: () => d.commands({ type: 'gift' }),
    });
    this.dailyBtn = new PlateButton(scene, L.daily.x, L.daily.y, {
      w: L.daily.w,
      h: L.daily.h,
      label: t('hub.daily'),
      fontSize: 27,
      sub: '',
      icon: 'svg_gift',
      iconSize: 44,
      radius: 28,
      onClick: () => d.commands({ type: 'daily' }),
    });
    this.items.push(this.giftBtn, this.dailyBtn);
    this.showRewards(state.gift, state.daily);
    scene.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        const s = d.state();
        this.showRewards(s.gift, s.daily);
      },
    });

    // --- комната, прогресс и «Играть»
    this.buildRecord(state.record);
    const glow = scene.add
      .image(L.play.x, L.play.y, 'glow')
      .setTint(COLOR.gold)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(L.play.w + 120, L.play.h + 150)
      .setAlpha(0);
    scene.tweens.add({
      targets: glow,
      alpha: { from: 0.1, to: 0.32 },
      delay: 500,
      duration: TIMING.playPulseCycle / 2,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    const play = new PlateButton(scene, L.play.x, L.play.y, {
      w: L.play.w,
      h: L.play.h,
      label: t('hub.play'),
      font: 'title',
      fontSize: 62,
      style: 'gold',
      radius: 36,
      pulse: { cycle: TIMING.playPulseCycle, scale: TIMING.playPulseScale },
      onClick: () => d.commands({ type: 'play' }),
    });
    glow.setDepth(-1);
    this.items.push(play);

    this.buildHints(state.hint);
    scene.input.keyboard?.on('keydown-ENTER', () => d.commands({ type: 'play' }));
    scene.input.keyboard?.on('keydown-SPACE', () => d.commands({ type: 'play' }));

    // --- вход: меню «сжимается» в свою кнопку, остальное плавно проявляется
    if (fromMenu) zoomIn(scene, HubLayout.menuRect(fromMenu));
    const fromShop = d.from === 'shop';
    this.items.forEach((o, i) => this.introIn(o, fromShop ? 0 : i * 30));
  }

  autoSkilled(buys: number): void {
    toast(this.scene, t('auto.skill.result', { n: buys }), 'ico_soul');
  }

  rewarded(): void {
    toast(this.scene, t('toast.reward'));
  }

  showRewards(gift: GiftState, daily: DailyStatus): void {
    if (!this.giftBtn.scene || !this.dailyBtn.scene) return;
    this.giftBtn.setBadge(gift.ready);
    this.giftBtn.setSub(gift.ready ? t('common.claim') : fmtTime(gift.remainingMs));
    this.giftBtn.setLocked(!gift.ready);
    this.dailyBtn.setBadge(daily.available);
    this.dailyBtn.setSub(
      daily.available ? t('daily.day', { n: daily.dayIndex + 1 }) : t('daily.tomorrow_short'),
    );
  }

  /** Перед лавкой всё, кроме её кнопки, гаснет: окно лавки вырастает из кнопки на пустом фоне. */
  clearForShop(): void {
    this.items
      .filter((o) => o !== this.shopBtn)
      .forEach((o) => this.scene.tweens.add({ targets: o, alpha: 0, duration: 200 }));
    this.hints.forEach((h) => (h as Phaser.GameObjects.Text).setVisible(false));
  }

  private introIn(o: Phaser.GameObjects.GameObject, delay = 0): void {
    const g = o as Phaser.GameObjects.Container;
    if (!g.scene) return;
    const y = g.y;
    g.setAlpha(0);
    g.y = y + 18;
    this.scene.tweens.add({
      targets: g,
      alpha: 1,
      y,
      duration: 380,
      delay: 60 + delay,
      ease: 'Cubic.easeOut',
    });
  }

  /**
   * Плашка рекорда: самая высокая комната, пройденная за один забег. Сам забег всегда начинается
   * с 1-1, поэтому здесь не «следующая комната», а докуда удалось дойти.
   */
  private buildRecord(rec: HubRecord): void {
    const s = this.scene;
    const r = HubLayout.room;
    const c = s.add.container(r.x, r.y);
    c.add(s.add.image(0, 8, shadowTexture(s, r.w, r.h, 28, 18)).setAlpha(0.85));
    c.add(s.add.image(0, 0, plateTexture(s, r.w, r.h, 1, 'panel', 28)));
    const left = -r.w / 2 + 32;
    c.add(
      txt(s, left, -22, t(`floor.${rec.floor}.name` as TKey).toUpperCase(), 19, {
        origin: [0, 0.5],
        color: HEX.textMute,
        weight: 800,
        strokeThickness: 0,
      }),
    );
    c.add(
      txt(
        s,
        left,
        8,
        rec.cleared > 0 ? t('game.record', { n: rec.roomId }) : t('game.room', { r: rec.roomId }),
        36,
        { font: 'title', origin: [0, 0.5], color: HEX.gold, strokeThickness: 0 },
      ),
    );
    c.add(
      txt(s, r.w / 2 - 32, -6, `${rec.cleared} / ${rec.total}`, 26, {
        origin: [1, 0.5],
        color: HEX.textDim,
        weight: 800,
        strokeThickness: 0,
      }),
    );
    // прогресс башни: три этажа
    const bw = r.w - 64;
    const by = 36;
    c.add(s.add.image(0, by, plateTexture(s, bw, 12, 1, 'dark', 6)));
    const fillW = Math.max(12, (bw * rec.cleared) / rec.total);
    if (rec.cleared > 0)
      c.add(s.add.image(-bw / 2 + fillW / 2, by, plateTexture(s, fillW, 12, 1, 'gold', 6)));
    for (let f = 1; f < rec.floors; f++) {
      c.add(
        s.add
          .image(-bw / 2 + (bw * f) / rec.floors, by, 'px')
          .setTint(0xffffff)
          .setAlpha(0.28)
          .setDisplaySize(2, 12),
      );
    }
    this.items.push(c);
  }

  private buildHints(hint: HubHint | null): void {
    const L = HubLayout;
    if (hint === 'skill') {
      this.hints.push(
        txt(this.scene, GAME_W / 2, 118, t('tut.hub_skill'), 24, { color: HEX.gold, wrap: 640 }),
        tapHint(this.scene, L.hero.x, L.hero.y + 30),
      );
    } else if (hint === 'play') {
      // после первого улучшения — только «палец» у «Играть», без лозунга
      this.hints.push(tapHint(this.scene, L.play.x + 200, L.play.y));
    }
  }
}
