import Phaser from 'phaser';

import { EnterHub } from '../../application/hub/EnterHub';
import { GetHubState } from '../../application/hub/GetHubState';
import { HubController } from '../../application/hub/HubController';
import type { HubOrigin } from '../../application/hub/interfaces/HubOrigin';
import { ClaimDailyReward } from '../../application/rewards/ClaimDailyReward';
import { ClaimTowerGift } from '../../application/rewards/ClaimTowerGift';
import { AudioSettings } from '../../application/settings/AudioSettings';
import { ShopCatalog } from '../../application/shop/ShopCatalog';
import { bindAchievementToasts } from '../components';
import { HubDialogs } from '../dialogs/HubDialogs';
import { HubNavigator } from '../navigation/HubNavigator';
import { PhaserClock } from '../phaser/PhaserClock';
import { HubView } from '../views/hub/HubView';
import type { SceneServices } from './interfaces/SceneServices';

/**
 * Главный экран. Сцена только координирует: вход в хаб (платформа, автопрокачка), сборка вида
 * и связка с потоком хаба (`HubController`), который отвечает на нажатия.
 */
export class HubScene extends Phaser.Scene {
  private from?: HubOrigin;
  private controller?: HubController;

  constructor(private readonly services: SceneServices) {
    super('Hub');
  }

  init(data: { from?: HubOrigin } = {}): void {
    this.from = data.from;
    this.controller = undefined;
  }

  create(): void {
    const { profile, platform, ads } = this.services;
    bindAchievementToasts(this, profile.achievementUnlocked);
    new EnterHub(platform).execute();
    const state = new GetHubState(profile, new ShopCatalog(profile));
    const view = new HubView(this, {
      state: () => state.execute(),
      commands: (cmd) => this.controller?.execute(cmd),
      hero: profile,
      wallet: profile,
      audio: new AudioSettings(profile, this.services.audio),
      from: this.from,
    });
    this.controller = new HubController({
      profile,
      state,
      daily: new ClaimDailyReward(profile, ads),
      gift: new ClaimTowerGift(profile, ads),
      view,
      dialogs: new HubDialogs(this),
      navigator: new HubNavigator(this, view),
      clock: new PhaserClock(this),
    });
    void this.controller.start(this.from);
  }
}
