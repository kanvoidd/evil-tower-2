import type { Profile } from '../../domain/account';
import { CONSUMABLE_SLOTS, CONSUMABLES, type ItemDef, type LineageId } from '../../domain/catalog';
import { ShopRules } from '../../domain/economy';
import type { ConsumableOffer } from './interfaces/ConsumableOffer';
import type { ItemOffer } from './interfaces/ItemOffer';

/**
 * Что лавка предлагает герою: снаряжение со своим действием (купить, починить, надето, не нужно)
 * и расходники с запасом. Правила лавки и цена починки — в экономике (`ShopRules`,
 * `IRepairPricing`); здесь — сборка предложений для экрана и «хватает ли золота».
 */
export class ShopCatalog {
  constructor(private readonly profile: Profile) {}

  /** Линейка героя: оружие в лавке — только её. */
  get lineage(): LineageId {
    return this.profile.activeLineage;
  }

  /** Оружие линейки героя или броня — в порядке каталога (по ступеням). */
  items(slot: 'weapon' | 'armor'): ItemOffer[] {
    return ShopRules.stock(slot, this.profile.activeLineage).map((it) => this.offer(it));
  }

  consumables(): ConsumableOffer[] {
    return CONSUMABLE_SLOTS.map((id) => {
      const def = CONSUMABLES[id];
      const owned = this.profile.heroSave.consumables[id];
      return { def, owned, full: ShopRules.stockFull(def, owned) };
    });
  }

  /** Следующая ступень оружия героя или брони уже по карману. */
  hasAffordableUpgrade(): boolean {
    const p = this.profile;
    return ShopRules.nextTiers(p.activeLineage, p.equipped('weapon'), p.equipped('armor')).some(
      (i) => p.gold >= i.price,
    );
  }

  private offer(item: ItemDef): ItemOffer {
    const p = this.profile;
    const cur = p.equipped(item.slot);
    const action = ShopRules.itemAction(item, cur);
    if (action === 'equipped')
      return { item, action, price: 0, durability: cur!.durability, affordable: false };
    if (action === 'repair') {
      const price = p.repairCost(item);
      return { item, action, price, durability: cur!.durability, affordable: p.gold >= price };
    }
    const affordable = action === 'buy' && p.gold >= item.price;
    return { item, action, price: item.price, durability: item.durability, affordable };
  }
}
