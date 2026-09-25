import type Phaser from 'phaser';

import type { IShopNavigator } from '../../application/shop/interfaces/IShopNavigator';
import { MenuExit } from './MenuExit';

/** Из лавки — обратно в хаб: содержимое гаснет, окно сжимается в кнопку лавки. */
export class ShopNavigator implements IShopNavigator {
  private readonly exit: MenuExit;

  constructor(scene: Phaser.Scene) {
    this.exit = new MenuExit(scene, 'shop');
  }

  close(): void {
    this.exit.leave();
  }
}
