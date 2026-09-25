import type Phaser from 'phaser';

import type { ISettingsNavigator } from '../../application/settings/interfaces/ISettingsNavigator';
import { MenuExit } from './MenuExit';

/** Из настроек — в хаб; после смены языка экран собирается заново (без окна-перехода). */
export class SettingsNavigator implements ISettingsNavigator {
  private readonly exit: MenuExit;

  constructor(private readonly scene: Phaser.Scene) {
    this.exit = new MenuExit(scene, 'settings');
  }

  close(): void {
    this.exit.leave();
  }

  reload(): void {
    this.scene.scene.restart({ noZoom: true });
  }
}
