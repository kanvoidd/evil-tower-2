import { CONSUMABLE_SLOTS, CONSUMABLES } from '../../domain/data/consumables';
import { ITEM_BY_ID, ITEMS, type ItemDef } from '../../domain/data/items';
import type { Profile } from '../../domain/logic/profile';
import type { LineageId } from '../../domain/types';
import type { ConsumableOffer } from './interfaces/ConsumableOffer';
import type { ItemOffer } from './interfaces/ItemOffer';

/**
 * Что лавка предлагает герою: снаряжение со своим действием (купить, починить, надето, не нужно)
 * и расходники с запасом. Цены, починка и «хватает ли золота» считаются здесь, а не в экране.
 */
export class ShopCatalog {
  constructor(private readonly profile: Profile) {}

  /** Линейка героя: оружие в лавке — только её. */
  get lineage(): LineageId {
    return this.profile.activeLineage;
  }

  /** Оружие линейки героя или броня — в порядке каталога (по ступеням). */
  items(slot: 'weapon' | 'armor'): ItemOffer[] {
    const lin = this.profile.activeLineage;
    return ITEMS.filter((i) => i.slot === slot && (i.slot === 'armor' || i.lineage === lin)).map((it) => this.offer(it));
  }

  consumables(): ConsumableOffer[] {
    return CONSUMABLE_SLOTS.map((id) => {
      const def = CONSUMABLES[id];
      const owned = this.profile.heroSave.consumables[id];
      return { def, owned, full: def.max !== undefined && owned >= def.max };
    });
  }

  /** Следующая ступень оружия героя или брони уже по карману. */
  hasAffordableUpgrade(): boolean {
    const p = this.profile;
    const w = p.equipped('weapon');
    const a = p.equipped('armor');
    const lin = p.activeLineage;
    const wt = w ? ITEMS.find((i) => i.id === w.id)!.tier : 0;
    const at = a ? ITEMS.find((i) => i.id === a.id)!.tier : 0;
    return ITEMS.some((i) => {
      if (i.slot === 'weapon') return i.lineage === lin && i.tier === wt + 1 && p.gold >= i.price;
      return i.tier === at + 1 && p.gold >= i.price;
    });
  }

  private offer(item: ItemDef): ItemOffer {
    const p = this.profile;
    const cur = p.equipped(item.slot);
    if (cur && cur.id === item.id) {
      if (cur.durability >= item.durability) return { item, action: 'equipped', price: 0, durability: cur.durability, affordable: false };
      const price = p.repairCost(item);
      return { item, action: 'repair', price, durability: cur.durability, affordable: p.gold >= price };
    }
    if (cur && ITEM_BY_ID[cur.id].tier >= item.tier) return { item, action: 'weaker', price: item.price, durability: item.durability, affordable: false };
    return { item, action: 'buy', price: item.price, durability: item.durability, affordable: p.gold >= item.price };
  }
}
