import Phaser from 'phaser';

import type { ConsumableOffer } from '../../../application/shop/interfaces/ConsumableOffer';
import type { IShopView } from '../../../application/shop/interfaces/IShopView';
import type { ItemOffer } from '../../../application/shop/interfaces/ItemOffer';
import type { ShopTab } from '../../../application/shop/interfaces/ShopTab';
import type { ConsumableDef, ItemDef } from '../../../domain/catalog';
import { ConsumableBalance } from '../../../domain/combat';
import { fmt, itemName, t, type TKey } from '../../../i18n';
import {
  background,
  closeButton,
  CurrencyBar,
  fitHeight,
  HeroCard,
  icon,
  outlineTexture,
  PlateButton,
  plateTexture,
  ScrollList,
  shadowTexture,
  staggerIn,
  statChip,
  toast,
  txt,
  UiSound,
} from '../../components';
import { dollyIn, zoomIn } from '../../navigation/SceneTransitions';
import { HEX } from '../../theme';
import type { ShopViewDeps } from './interfaces/ShopViewDeps';

/**
 * Лавка на экране: карточка героя слева, вкладки (оружие, броня, расходники) и прокручиваемый
 * список предложений. Вид рисует предложения `ShopCatalog` и отдаёт нажатия командами;
 * что купить и за сколько решает приложение.
 */
export class ShopView implements IShopView {
  /** Карточка героя: слева, по центру высоты. */
  private static readonly HERO = { x: 110, y: 640, scale: 0.62 } as const;
  private static readonly LIST = new Phaser.Geom.Rectangle(214, 218, 490, 1046);
  private static readonly ROW_W = 478;
  private static readonly ROW_H = 178;
  private static readonly ROW_GAP = 12;
  /** Вкладки: id, подпись, ширина. Порядок задаёт направление анимации при переключении. */
  private static readonly TABS: ReadonlyArray<[ShopTab, TKey, number]> = [
    ['weapon', 'shop.weapons', 140],
    ['armor', 'shop.armor', 140],
    ['consumable', 'shop.consumables', 196],
  ];
  private static readonly TAB_ORDER: readonly ShopTab[] = ShopView.TABS.map((d) => d[0]);
  private static readonly TAB_GAP = 7;
  private static readonly TAB_X0 = 214;
  private static readonly TAB_Y = 170;

  private tab: ShopTab = 'weapon';
  private readonly list: ScrollList;
  private hero?: HeroCard;
  private readonly tabs = {} as Record<ShopTab, PlateButton>;
  private readonly tabHl: Phaser.GameObjects.NineSlice;
  private switching = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly d: ShopViewDeps,
  ) {
    const S = ShopView;
    background(scene);
    this.buildHero(true);

    const title = txt(scene, 214, 62, t('shop.title'), 50, {
      font: 'title',
      origin: [0, 0.5],
      color: HEX.gold,
      strokeThickness: 6,
    });
    const cur = new CurrencyBar(scene, 590, 40, { wallet: d.wallet, compact: true });
    const close = closeButton(scene, () => d.commands({ type: 'close' }));

    // «Сегментная» полоса вкладок: тёмная дорожка и золотая подсветка, которая плавно переезжает на выбранную вкладку
    const bar = scene.add.container(0, 0);
    const trackW = S.TABS.reduce((a, def) => a + def[2], 0) + S.TAB_GAP * (S.TABS.length - 1) + 12;
    bar.add(
      scene.add.image(
        S.TAB_X0 - 6 + trackW / 2,
        S.TAB_Y,
        plateTexture(scene, trackW, 70, 1, 'dark', 26),
      ),
    );
    this.tabHl = scene.add.nineslice(
      S.tabCenter('weapon'),
      S.TAB_Y,
      plateTexture(scene, 64, 58, 1, 'gold', 20),
      undefined,
      S.tabWidth('weapon'),
      58,
      22,
      22,
      22,
      22,
    );
    bar.add(this.tabHl);
    S.TABS.forEach(([id, key, w]) => {
      this.tabs[id] = new PlateButton(scene, S.tabCenter(id), S.TAB_Y, {
        w,
        h: 58,
        label: t(key),
        fontSize: 22,
        radius: 20,
        style: 'glass',
        shadow: false,
        onClick: () => this.setTab(id),
      });
      bar.add(this.tabs[id]);
    });
    this.paintTabs(false);

    this.list = new ScrollList(scene, S.LIST, 1000);
    this.setTab('weapon', false);
    scene.input.keyboard?.on('keydown-ESC', () => d.commands({ type: 'close' }));

    // вход: меню проявляется из «окна» кнопки, затем элементы по очереди занимают места
    if (d.fromHub) zoomIn(scene);
    else dollyIn(scene, 320);
    const base = d.fromHub ? 200 : 60;
    staggerIn(scene, [title, cur], { dy: -22, delay: base, gap: 70 });
    staggerIn(scene, [close], { dy: -22, delay: base + 40, gap: 0 });
    staggerIn(scene, [bar], { dy: 22, delay: base + 60, gap: 0 });
    staggerIn(scene, [...this.list.content.list], { dy: 44, delay: base + 140, gap: 65, ms: 380 });
  }

  itemBought(item: ItemDef, repaired: boolean): void {
    UiSound.play('buy');
    toast(this.scene, repaired ? t('shop.repaired') : t('shop.bought'), item.icon);
    this.buildHero(false);
    this.rebuild();
  }

  consumableBought(): void {
    UiSound.play('buy');
    this.rebuild();
  }

  noGold(): void {
    UiSound.play('error');
    toast(this.scene, t('shop.no_gold'), 'ico_gold');
  }

  stackFull(def: ConsumableDef): void {
    UiSound.play('error');
    toast(this.scene, t('shop.stack_full', { n: def.max ?? 0 }), def.icon);
  }

  denied(): void {
    UiSound.play('error');
  }

  private static tabWidth(id: ShopTab): number {
    return ShopView.TABS.find((d) => d[0] === id)![2];
  }

  private static tabCenter(id: ShopTab): number {
    let x = ShopView.TAB_X0;
    for (const [k, , w] of ShopView.TABS) {
      if (k === id) return x + w / 2;
      x += w + ShopView.TAB_GAP;
    }
    return x;
  }

  /** Подсветка вкладки и цвет подписей: у выбранной подпись тёмная (на золоте), у остальных светлая. */
  private paintTabs(animate: boolean): void {
    const x = ShopView.tabCenter(this.tab);
    const w = ShopView.tabWidth(this.tab);
    if (animate)
      this.scene.tweens.add({
        targets: this.tabHl,
        x,
        width: w,
        duration: 340,
        ease: 'Back.easeOut',
      });
    else {
      this.tabHl.setPosition(x, ShopView.TAB_Y);
      this.tabHl.width = w;
    }
    ShopView.TAB_ORDER.forEach((k) => {
      const sel = k === this.tab;
      const lbl = this.tabs[k].labelText;
      lbl?.setColor(sel ? '#2b1c06' : HEX.text);
      lbl?.setStroke(HEX.dark, sel ? 0 : 4);
    });
  }

  private buildHero(animate: boolean): void {
    this.hero?.root.destroy();
    this.hero = new HeroCard(this.scene, ShopView.HERO.x, ShopView.HERO.y, this.d.hero, false);
    this.hero.root.setScale(ShopView.HERO.scale);
    if (animate) {
      this.hero.root.setAlpha(0);
      this.scene.tweens.add({ targets: this.hero.root, alpha: 1, duration: 360, delay: 120 });
    }
  }

  /**
   * Переключение вкладки: подсветка «переезжает» на новую, старые строки уходят в сторону, откуда мы едем,
   * новые въезжают по очереди с проявлением. Направление зависит от порядка вкладок.
   */
  private setTab(tab: ShopTab, animate = true): void {
    if (this.switching || (animate && tab === this.tab)) return;
    const order = ShopView.TAB_ORDER;
    const dir = order.indexOf(tab) >= order.indexOf(this.tab) ? 1 : -1;
    this.tab = tab;
    this.paintTabs(animate);
    if (!animate) {
      this.rebuild(0);
      return;
    }
    this.switching = true;
    const rows = [...this.list.content.list] as Phaser.GameObjects.Container[];
    rows.forEach((r, i) =>
      this.scene.tweens.add({
        targets: r,
        alpha: 0,
        x: r.x - dir * 34,
        duration: 130,
        delay: i * 22,
        ease: 'Sine.easeIn',
      }),
    );
    this.scene.time.delayedCall(150 + rows.length * 22, () => {
      this.rebuild(dir);
      this.switching = false;
    });
  }

  private rebuild(dir = 0): void {
    const S = ShopView;
    const keep = this.list.content;
    keep.removeAll(true);
    let y = 0;
    const add = (row: Phaser.GameObjects.Container): void => {
      row.y = y + S.ROW_H / 2;
      row.x = S.LIST.width / 2 - 2;
      keep.add(row);
      y += S.ROW_H + S.ROW_GAP;
    };
    if (this.tab === 'consumable') {
      this.d.catalog.consumables().forEach((o) => add(this.consumableRow(o)));
    } else {
      if (this.tab === 'weapon') {
        const lin = this.d.catalog.lineage;
        keep.add(
          txt(
            this.scene,
            S.LIST.width / 2,
            16,
            t('shop.for_class', { c: t(`class.${lin}.name` as TKey) }),
            21,
            { color: HEX.textMute, weight: 700, strokeThickness: 0 },
          ),
        );
        y += 38;
      }
      this.d.catalog.items(this.tab).forEach((o) => add(this.itemRow(o)));
    }
    this.list.setContentHeight(y + 20);
    if (dir !== 0) {
      this.list.setOffset(0);
      staggerIn(this.scene, [...keep.list], { dx: dir * 56, dy: 0, delay: 20, gap: 55, ms: 340 });
    }
  }

  private rowFrame(row: Phaser.GameObjects.Container, equipped: boolean): void {
    const s = this.scene;
    const { ROW_W, ROW_H } = ShopView;
    row.add(s.add.image(0, 7, shadowTexture(s, ROW_W, ROW_H, 26, 14)).setAlpha(0.8));
    row.add(s.add.image(0, 0, plateTexture(s, ROW_W, ROW_H, 1, 'panel', 26)));
    if (equipped) row.add(s.add.image(0, 0, outlineTexture(s, ROW_W, ROW_H, 26, '#f0c75e', 3)));
  }

  private iconTile(row: Phaser.GameObjects.Container, key: string): void {
    row.add(this.scene.add.image(-176, -28, plateTexture(this.scene, 92, 92, 1, 'dark', 22)));
    row.add(icon(this.scene, -176, -28, key, 66));
  }

  private itemRow(o: ItemOffer): Phaser.GameObjects.Container {
    const s = this.scene;
    const it = o.item;
    const row = s.add.container(0, 0);
    const equipped = o.action === 'equipped' || o.action === 'repair';
    this.rowFrame(row, equipped);
    this.iconTile(row, it.icon);
    row.add(txt(s, -114, -60, itemName(it), 25, { origin: [0, 0.5], maxWidth: 336, weight: 900 }));
    let sx = -114;
    const chip = (stat: string, v: number): void => {
      row.add(statChip(s, sx + 15, -24, stat, `+${v}`, 30, 21));
      sx += 100;
    };
    if (it.damage) chip('damage', it.damage);
    if (it.defense) chip('defense', it.defense);
    if (it.health) chip('health', it.health);
    const k = Phaser.Math.Clamp(o.durability / it.durability, 0, 1);
    row.add(
      txt(s, -114, 6, t('shop.durability', { n: o.durability, max: it.durability }), 17, {
        origin: [0, 0.5],
        color: HEX.textDim,
        weight: 700,
        strokeThickness: 0,
      }),
    );
    row.add(s.add.rectangle(-114 + 170, 22, 340, 6, 0x000000, 0.45));
    row.add(
      s.add
        .rectangle(-114, 22, Math.max(3, 340 * k), 6, k > 0.25 ? 0x66e39c : 0xff7468)
        .setOrigin(0, 0.5),
    );

    let label = fmt(o.price);
    let locked = false;
    let style: 'gold' | 'green' | 'raised' = 'gold';
    let ico: string | undefined = 'ico_gold';
    if (o.action === 'equipped' || o.action === 'weaker') {
      label = o.action === 'equipped' ? t('shop.equipped') : t('shop.weaker');
      locked = true;
      style = 'raised';
      ico = undefined;
    } else if (o.action === 'repair') {
      label = `${t('shop.repair')}  ${fmt(o.price)}`;
      style = 'green';
    }
    const btn = new PlateButton(s, 0, 58, {
      w: ShopView.ROW_W - 32,
      h: 54,
      label,
      fontSize: 24,
      icon: ico,
      iconSize: 30,
      style,
      radius: 18,
      shadow: false,
      sound: null,
      onClick: () => this.d.commands({ type: 'buy-item', item: it }),
    });
    btn.setLocked(locked);
    row.add(btn);
    if (o.action === 'buy' && !o.affordable) btn.pulseC.setAlpha(0.6);
    return row;
  }

  private consumableRow(o: ConsumableOffer): Phaser.GameObjects.Container {
    const s = this.scene;
    const { def } = o;
    const id = def.id;
    const row = s.add.container(0, 0);
    this.rowFrame(row, false);
    this.iconTile(row, def.icon);
    const nameKey =
      id === 'potion_heal'
        ? 'shop.potion_heal'
        : id === 'potion_regen'
          ? 'shop.potion_regen'
          : 'shop.artifact';
    row.add(
      txt(s, -114, -64, t(nameKey as TKey), 25, { origin: [0, 0.5], maxWidth: 336, weight: 900 }),
    );
    const desc =
      id === 'potion_heal'
        ? t('shop.potion_heal.desc', { n: Math.round(ConsumableBalance.healPotionPct * 100) })
        : id === 'potion_regen'
          ? t('shop.potion_regen.desc', { n: ConsumableBalance.regenBoostTurns })
          : t('shop.artifact.desc');
    const info = txt(s, -114, -47, desc, 17, {
      origin: [0, 0],
      wrap: 336,
      color: HEX.textDim,
      weight: 700,
      strokeThickness: 0,
      lineSpacing: 0,
      align: 'left',
    });
    fitHeight(info, 42);
    row.add(info);
    const ownedText =
      def.max !== undefined
        ? t('shop.owned_max', { n: o.owned, max: def.max })
        : t('shop.owned', { n: o.owned });
    row.add(
      txt(s, -114, 13, ownedText, 18, {
        origin: [0, 0.5],
        color: o.full ? HEX.gold : HEX.good,
        weight: 800,
        strokeThickness: 0,
      }),
    );
    if (def.sold) {
      const buy = (): void => this.d.commands({ type: 'buy-consumable', id });
      const btn = new PlateButton(s, 0, 58, {
        w: ShopView.ROW_W - 32,
        h: 54,
        label: fmt(def.price),
        fontSize: 24,
        icon: 'ico_gold',
        iconSize: 30,
        style: 'gold',
        radius: 18,
        shadow: false,
        sound: null,
        onClick: buy,
      });
      // полный запас: кнопка приглушена и по нажатию объясняет предел
      if (o.full) btn.setLocked(true, buy);
      row.add(btn);
    }
    return row;
  }
}
