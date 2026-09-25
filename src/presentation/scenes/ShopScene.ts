import Phaser from 'phaser';
import { BuyConsumable } from '../../application/shop/BuyConsumable';
import { BuyItem } from '../../application/shop/BuyItem';
import { ShopCatalog } from '../../application/shop/ShopCatalog';
import { ShopController } from '../../application/shop/ShopController';
import { bindAchievementToasts } from '../components';
import { ShopNavigator } from '../navigation/ShopNavigator';
import { ShopView } from '../views/shop/ShopView';
import type { SceneServices } from './interfaces/SceneServices';

/** Лавка. Сцена только собирает вид и связывает его с потоком лавки (`ShopController`). */
export class ShopScene extends Phaser.Scene {
  private controller?: ShopController;

  constructor(private readonly services: SceneServices) {
    super('Shop');
  }

  init(): void {
    this.controller = undefined;
  }

  create(): void {
    const { profile } = this.services;
    bindAchievementToasts(this, profile.achievementUnlocked);
    const view = new ShopView(this, {
      catalog: new ShopCatalog(profile),
      commands: (cmd) => this.controller?.execute(cmd),
      hero: profile,
      wallet: profile,
      fromHub: !!(this.scene.settings.data as { zoomIn?: boolean } | undefined)?.zoomIn,
    });
    this.controller = new ShopController({
      buyItem: new BuyItem(profile),
      buyConsumable: new BuyConsumable(profile),
      view,
      navigator: new ShopNavigator(this),
    });
  }
}
