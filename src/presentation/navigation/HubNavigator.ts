import type Phaser from 'phaser';

import type { HubMenu } from '../../application/hub/interfaces/HubMenu';
import type { IHubNavigator } from '../../application/hub/interfaces/IHubNavigator';
import { UiSound } from '../components';
import { HubLayout } from '../views/hub/HubLayout';
import type { HubView } from '../views/hub/HubView';
import { fadeToScene, zoomOut } from './SceneTransitions';

/** Уход из хаба: меню вырастает окном из своей кнопки, бой начинается «наездом» камеры. */
export class HubNavigator implements IHubNavigator {
  private static readonly SCENES: Record<HubMenu, string> = {
    shop: 'Shop',
    levels: 'Levels',
    settings: 'Settings',
    skill: 'SkillTree',
    achievements: 'Achievements',
  };

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly view: HubView,
  ) {}

  open(menu: HubMenu): void {
    if (menu === 'shop') this.view.clearForShop();
    zoomOut(this.scene, HubLayout.menuRect(menu), HubNavigator.SCENES[menu]);
  }

  play(): void {
    UiSound.play('open');
    fadeToScene(this.scene, 'Game', {});
  }
}
