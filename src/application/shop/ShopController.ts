import { CONSUMABLES } from '../../domain/catalog/consumables';
import type { ItemDef } from '../../domain/catalog/items';
import type { ConsumableId } from '../../domain/types';
import type { ShopCommand } from './interfaces/ShopCommand';
import type { ShopControllerDeps } from './interfaces/ShopControllerDeps';

/**
 * Поток лавки: команда игрока → покупка → отклик экрана.
 *
 *   кнопка → ShopCommand → ShopController → BuyItem / BuyConsumable → IShopView
 *
 * Экран не считает цены и не проверяет кошелёк — он показывает предложения `ShopCatalog`
 * и итог покупки.
 */
export class ShopController {
  private closing = false;

  constructor(private readonly d: ShopControllerDeps) {}

  execute(cmd: ShopCommand): void {
    switch (cmd.type) {
      case 'buy-item':
        this.buyItem(cmd.item);
        return;
      case 'buy-consumable':
        this.buyConsumable(cmd.id);
        return;
      case 'close':
        this.close();
        return;
    }
  }

  private buyItem(item: ItemDef): void {
    const r = this.d.buyItem.execute(item);
    if (r === 'bought' || r === 'repaired') this.d.view.itemBought(item, r === 'repaired');
    else if (r === 'gold') this.d.view.noGold();
    else this.d.view.denied();
  }

  private buyConsumable(id: ConsumableId): void {
    const r = this.d.buyConsumable.execute(id);
    if (r === 'bought') this.d.view.consumableBought();
    else if (r === 'max') this.d.view.stackFull(CONSUMABLES[id]);
    else this.d.view.noGold();
  }

  private close(): void {
    if (this.closing) return;
    this.closing = true;
    this.d.navigator.close();
  }
}
