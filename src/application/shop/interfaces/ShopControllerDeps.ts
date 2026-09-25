import type { BuyConsumable } from '../BuyConsumable';
import type { BuyItem } from '../BuyItem';
import type { IShopNavigator } from './IShopNavigator';
import type { IShopView } from './IShopView';

export interface ShopControllerDeps {
  buyItem: BuyItem;
  buyConsumable: BuyConsumable;
  view: IShopView;
  navigator: IShopNavigator;
}
