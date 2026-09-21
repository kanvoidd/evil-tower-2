import Phaser from 'phaser';
import { GAMEPLAY, HEX } from '../config';
import { CONSUMABLE_SLOTS, CONSUMABLES, ITEMS, ITEM_BY_ID, type ItemDef } from '../data/items';
import type { ConsumableId } from '../types';
import { AUDIO } from '../systems/Audio';
import { Store } from '../systems/Store';
import { fmt, t, tr } from '../i18n';
import type { TKey } from '../i18n';
import {
  background, bindToasts, closeButton, CurrencyBar, dollyIn, fitHeight, icon, leaveMenu, outlineTexture, PlateButton, plateTexture,
  ScrollList, shadowTexture, staggerIn, statChip, toast, txt, zoomIn,
} from '../ui/Kit';
import { createHeroCard, type HeroCard } from '../ui/HeroCard';
import { SHOP_HERO } from './HubScene';

type Tab = 'weapon' | 'armor' | 'consumable';

const LIST = new Phaser.Geom.Rectangle(214, 218, 490, 1046);
const ROW_W = 478;
const ROW_H = 178;
const ROW_GAP = 12;

/** Вкладки лавки: id, подпись, ширина. Порядок задаёт направление анимации при переключении. */
const TAB_DEFS: Array<[Tab, TKey, number]> = [['weapon', 'shop.weapons', 140], ['armor', 'shop.armor', 140], ['consumable', 'shop.consumables', 196]];
const TAB_ORDER: Tab[] = TAB_DEFS.map((d) => d[0]);
const TAB_GAP = 7;
const TAB_X0 = 214;
const TAB_Y = 170;

const tabWidth = (id: Tab): number => TAB_DEFS.find((d) => d[0] === id)![2];
const tabCenter = (id: Tab): number => {
  let x = TAB_X0;
  for (const [k, , w] of TAB_DEFS) {
    if (k === id) return x + w / 2;
    x += w + TAB_GAP;
  }
  return x;
};

export class ShopScene extends Phaser.Scene {
  private tab: Tab = 'weapon';
  private list!: ScrollList;
  private hero?: HeroCard;
  private tabs: Record<Tab, PlateButton> = {} as Record<Tab, PlateButton>;
  private tabHl!: Phaser.GameObjects.NineSlice;
  private closing = false;
  private switching = false;

  constructor() {
    super('Shop');
  }

  init(): void {
    this.closing = false;
    this.switching = false;
    this.tab = 'weapon';
  }

  create(): void {
    background(this);
    bindToasts(this);
    this.buildHero(true);

    const title = txt(this, 214, 62, t('shop.title'), 50, { font: 'title', origin: [0, 0.5], color: HEX.gold, strokeThickness: 6 });
    const cur = new CurrencyBar(this, 590, 40, { compact: true });
    const close = closeButton(this, () => this.close());

    // «Сегментная» полоса вкладок: тёмная дорожка и золотая подсветка, которая плавно переезжает на выбранную вкладку
    const bar = this.add.container(0, 0);
    const trackW = TAB_DEFS.reduce((a, d) => a + d[2], 0) + TAB_GAP * (TAB_DEFS.length - 1) + 12;
    bar.add(this.add.image(TAB_X0 - 6 + trackW / 2, TAB_Y, plateTexture(this, trackW, 70, 1, 'dark', 26)));
    this.tabHl = this.add.nineslice(tabCenter('weapon'), TAB_Y, plateTexture(this, 64, 58, 1, 'gold', 20), undefined, tabWidth('weapon'), 58, 22, 22, 22, 22);
    bar.add(this.tabHl);
    TAB_DEFS.forEach(([id, key, w]) => {
      this.tabs[id] = new PlateButton(this, tabCenter(id), TAB_Y, {
        w, h: 58, label: t(key), fontSize: 22, radius: 20, style: 'glass', shadow: false, onClick: () => this.setTab(id),
      });
      bar.add(this.tabs[id]);
    });
    this.paintTabs(false);

    this.list = new ScrollList(this, LIST, 1000);
    this.setTab('weapon', false);
    this.input.keyboard?.on('keydown-ESC', () => this.close());

    // вход: меню проявляется из «окна» кнопки, затем элементы по очереди занимают места
    const fromHub = !!(this.scene.settings.data as { zoomIn?: boolean } | undefined)?.zoomIn;
    if (fromHub) zoomIn(this);
    else dollyIn(this, 320);
    const base = fromHub ? 200 : 60;
    staggerIn(this, [title, cur], { dy: -22, delay: base, gap: 70 });
    staggerIn(this, [close], { dy: -22, delay: base + 40, gap: 0 });
    staggerIn(this, [bar], { dy: 22, delay: base + 60, gap: 0 });
    staggerIn(this, [...this.list.content.list], { dy: 44, delay: base + 140, gap: 65, ms: 380 });
  }

  /** Подсветка вкладки и цвет подписей: у выбранной подпись тёмная (на золоте), у остальных светлая. */
  private paintTabs(animate: boolean): void {
    const x = tabCenter(this.tab);
    const w = tabWidth(this.tab);
    if (animate) this.tweens.add({ targets: this.tabHl, x, width: w, duration: 340, ease: 'Back.easeOut' });
    else {
      this.tabHl.setPosition(x, TAB_Y);
      this.tabHl.width = w;
    }
    TAB_ORDER.forEach((k) => {
      const sel = k === this.tab;
      const lbl = this.tabs[k].labelText;
      lbl?.setColor(sel ? '#2b1c06' : HEX.text);
      lbl?.setStroke(HEX.dark, sel ? 0 : 4);
    });
  }

  private buildHero(animate: boolean): void {
    this.hero?.root.destroy();
    this.hero = createHeroCard(this, SHOP_HERO.x, SHOP_HERO.y, false);
    this.hero.root.setScale(SHOP_HERO.scale);
    if (animate) {
      this.hero.root.setAlpha(0);
      this.tweens.add({ targets: this.hero.root, alpha: 1, duration: 360, delay: 120 });
    }
  }

  /**
   * Переключение вкладки: подсветка «переезжает» на новую, старые строки уходят в сторону, откуда мы едем,
   * новые въезжают по очереди с проявлением. Направление зависит от порядка вкладок.
   */
  private setTab(tab: Tab, animate = true): void {
    if (this.switching || (animate && tab === this.tab)) return;
    const dir = TAB_ORDER.indexOf(tab) >= TAB_ORDER.indexOf(this.tab) ? 1 : -1;
    this.tab = tab;
    this.paintTabs(animate);
    if (!animate) {
      this.rebuild(0);
      return;
    }
    this.switching = true;
    const rows = [...this.list.content.list] as Phaser.GameObjects.Container[];
    rows.forEach((r, i) => this.tweens.add({ targets: r, alpha: 0, x: r.x - dir * 34, duration: 130, delay: i * 22, ease: 'Sine.easeIn' }));
    this.time.delayedCall(150 + rows.length * 22, () => {
      this.rebuild(dir);
      this.switching = false;
    });
  }

  private rebuild(dir = 0): void {
    const keep = this.list.content;
    keep.removeAll(true);
    let y = 0;
    const add = (row: Phaser.GameObjects.Container): void => {
      row.y = y + ROW_H / 2;
      row.x = LIST.width / 2 - 2;
      keep.add(row);
      y += ROW_H + ROW_GAP;
    };
    if (this.tab === 'consumable') {
      CONSUMABLE_SLOTS.forEach((id) => add(this.consumableRow(id)));
    } else {
      const lin = Store.activeLineage;
      const items = ITEMS.filter((i) => i.slot === this.tab && (i.slot === 'armor' || i.lineage === lin));
      if (this.tab === 'weapon') {
        keep.add(txt(this, LIST.width / 2, 16, t('shop.for_class', { c: t(`class.${lin}.name` as TKey) }), 21, { color: HEX.textMute, weight: 700, strokeThickness: 0 }));
        y += 38;
      }
      items.forEach((it) => add(this.itemRow(it)));
    }
    this.list.setContentHeight(y + 20);
    if (dir !== 0) {
      this.list.setOffset(0);
      staggerIn(this, [...keep.list], { dx: dir * 56, dy: 0, delay: 20, gap: 55, ms: 340 });
    }
  }

  private rowFrame(row: Phaser.GameObjects.Container, equipped: boolean): void {
    row.add(this.add.image(0, 7, shadowTexture(this, ROW_W, ROW_H, 26, 14)).setAlpha(0.8));
    row.add(this.add.image(0, 0, plateTexture(this, ROW_W, ROW_H, 1, 'panel', 26)));
    if (equipped) row.add(this.add.image(0, 0, outlineTexture(this, ROW_W, ROW_H, 26, '#f0c75e', 3)));
  }

  private iconTile(row: Phaser.GameObjects.Container, key: string): void {
    row.add(this.add.image(-176, -28, plateTexture(this, 92, 92, 1, 'dark', 22)));
    row.add(icon(this, -176, -28, key, 66));
  }

  private itemRow(it: ItemDef): Phaser.GameObjects.Container {
    const row = this.add.container(0, 0);
    const cur = Store.equipped(it.slot);
    const equipped = !!cur && cur.id === it.id;
    this.rowFrame(row, equipped);
    this.iconTile(row, it.icon);
    row.add(txt(this, -114, -60, tr(it.name), 25, { origin: [0, 0.5], maxWidth: 336, weight: 900 }));
    let sx = -114;
    const chip = (stat: string, v: number): void => {
      row.add(statChip(this, sx + 15, -24, stat, `+${v}`, 30, 21));
      sx += 100;
    };
    if (it.damage) chip('damage', it.damage);
    if (it.defense) chip('defense', it.defense);
    if (it.health) chip('health', it.health);
    const dur = equipped ? cur!.durability : it.durability;
    const k = Phaser.Math.Clamp(dur / it.durability, 0, 1);
    row.add(txt(this, -114, 6, t('shop.durability', { n: dur, max: it.durability }), 17, { origin: [0, 0.5], color: HEX.textDim, weight: 700, strokeThickness: 0 }));
    row.add(this.add.rectangle(-114 + 170, 22, 340, 6, 0x000000, 0.45));
    row.add(this.add.rectangle(-114, 22, Math.max(3, 340 * k), 6, k > 0.25 ? 0x66e39c : 0xff7468).setOrigin(0, 0.5));

    let label = '';
    let locked = false;
    let style: 'gold' | 'green' | 'raised' = 'gold';
    let ico: string | undefined = 'ico_gold';
    if (equipped) {
      if (cur!.durability >= it.durability) {
        label = t('shop.equipped');
        locked = true;
        style = 'raised';
        ico = undefined;
      } else {
        label = `${t('shop.repair')}  ${fmt(Store.repairCost(it))}`;
        style = 'green';
      }
    } else if (cur && ITEM_BY_ID[cur.id].tier >= it.tier) {
      label = t('shop.weaker');
      locked = true;
      style = 'raised';
      ico = undefined;
    } else {
      label = fmt(it.price);
    }
    const btn = new PlateButton(this, 0, 58, {
      w: ROW_W - 32, h: 54, label, fontSize: 24, icon: ico, iconSize: 30, style, radius: 18, shadow: false, sound: null,
      onClick: () => {
        if (this.list.contains(this.input.activePointer)) this.buyItem(it);
      },
    });
    btn.setLocked(locked);
    row.add(btn);
    if (!equipped && !locked && Store.gold < it.price) btn.pulseC.setAlpha(0.6);
    return row;
  }

  private consumableRow(id: ConsumableId): Phaser.GameObjects.Container {
    const def = CONSUMABLES[id];
    const row = this.add.container(0, 0);
    this.rowFrame(row, false);
    this.iconTile(row, def.icon);
    const nameKey = id === 'potion_heal' ? 'shop.potion_heal' : id === 'potion_regen' ? 'shop.potion_regen' : 'shop.artifact';
    row.add(txt(this, -114, -64, t(nameKey as TKey), 25, { origin: [0, 0.5], maxWidth: 336, weight: 900 }));
    const desc = id === 'potion_heal'
      ? t('shop.potion_heal.desc', { n: Math.round(GAMEPLAY.healPotionPct * 100) })
      : id === 'potion_regen'
        ? t('shop.potion_regen.desc', { n: GAMEPLAY.regenBoostTurns })
        : t('shop.artifact.desc');
    const info = txt(this, -114, -47, desc, 17, { origin: [0, 0], wrap: 336, color: HEX.textDim, weight: 700, strokeThickness: 0, lineSpacing: 0, align: 'left' });
    fitHeight(info, 42);
    row.add(info);
    row.add(txt(this, -114, 13, t('shop.owned', { n: Store.data.consumables[id] }), 18, { origin: [0, 0.5], color: HEX.good, weight: 800, strokeThickness: 0 }));
    if (def.sold) {
      const btn = new PlateButton(this, 0, 58, {
        w: ROW_W - 32, h: 54, label: fmt(def.price), fontSize: 24, icon: 'ico_gold', iconSize: 30, style: 'gold', radius: 18, shadow: false, sound: null,
        onClick: () => {
          if (this.list.contains(this.input.activePointer)) this.buyConsumable(id);
        },
      });
      row.add(btn);
    }
    return row;
  }

  private buyItem(it: ItemDef): void {
    const r = Store.buyItem(it);
    if (r === 'bought' || r === 'repaired') {
      AUDIO.play('buy');
      toast(this, r === 'bought' ? t('shop.bought') : t('shop.repaired'), it.icon);
      this.buildHero(false);
      this.rebuild();
    } else if (r === 'gold') {
      AUDIO.play('error');
      toast(this, t('shop.no_gold'), 'ico_gold');
    } else {
      AUDIO.play('error');
    }
  }

  private buyConsumable(id: ConsumableId): void {
    if (Store.buyConsumable(id)) {
      AUDIO.play('buy');
      this.rebuild();
    } else {
      AUDIO.play('error');
      toast(this, t('shop.no_gold'), 'ico_gold');
    }
  }

  private close(): void {
    if (this.closing) return;
    this.closing = true;
    AUDIO.play('click');
    leaveMenu(this, 'Hub', { from: 'shop' });
  }
}

