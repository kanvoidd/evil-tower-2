import Phaser from 'phaser';
import { AdService } from '../application/ads/AdService';
import { WebAudioPlayer } from '../infrastructure/audio/WebAudioPlayer';
import { YandexPlatform } from '../infrastructure/sdk/YandexPlatform';
import { ProfileStore } from '../infrastructure/store/ProfileStore';
import { UiSound } from '../presentation/components';
import { I18nLocale } from '../presentation/locale/I18nLocale';
import { AchievementsScene } from '../presentation/scenes/AchievementsScene';
import { BootScene } from '../presentation/scenes/BootScene';
import { ClassSelectScene } from '../presentation/scenes/ClassSelectScene';
import { GameScene } from '../presentation/scenes/GameScene';
import { HubScene } from '../presentation/scenes/HubScene';
import type { SceneServices } from '../presentation/scenes/interfaces/SceneServices';
import { LevelsScene } from '../presentation/scenes/LevelsScene';
import { SettingsScene } from '../presentation/scenes/SettingsScene';
import { ShopScene } from '../presentation/scenes/ShopScene';
import { SkillTreeScene } from '../presentation/scenes/SkillTreeScene';
import { GAME_H, GAME_W } from '../presentation/theme';

/**
 * Корень композиции — единственное место, где инфраструктура (SDK платформы, облако и
 * localStorage, звук) соединяется с приложением и сценами. Здесь создаются по одному экземпляру
 * служб, а сцены получают их через конструктор; ниже по слоям никто не знает, чем реализованы порты.
 */
export class GameCompositionRoot {
  private readonly platform = new YandexPlatform();
  private readonly audio = new WebAudioPlayer();
  private readonly store = new ProfileStore(this.platform);
  private readonly locale = new I18nLocale();

  start(): Phaser.Game {
    // Отклик кнопок, окон и тостов звучит через звуковой движок игры.
    UiSound.bind(this.audio);
    // Модерация Яндекс Игр: без контекстного меню и выделения текста.
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('selectstart', (e) => e.preventDefault());

    const profile = this.store.profile;
    const services: SceneServices = {
      profile,
      storage: this.store,
      platform: this.platform,
      sound: this.audio,
      audio: this.audio,
      locale: this.locale,
      ads: new AdService(this.platform, profile, () => Date.now()),
    };
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: 'game',
      width: GAME_W,
      height: GAME_H,
      backgroundColor: '#0d0f14',
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      render: { antialias: true, powerPreference: 'high-performance' },
      input: { activePointers: 2 },
      scene: [
        new BootScene({ profile, startup: () => this.startup() }),
        new ClassSelectScene(services),
        new HubScene(services),
        new ShopScene(services),
        new LevelsScene(services),
        new SettingsScene(services),
        new SkillTreeScene(services),
        new GameScene(services),
        new AchievementsScene(services),
      ],
    });

    // Пауза игры и звука на время рекламы/сворачивания.
    this.platform.onGamePause(() => {
      this.audio.suspend('ad');
      game.pause();
    });
    this.platform.onGameResume(() => {
      this.audio.unsuspend('ad');
      game.resume();
    });

    // Отладочный доступ к игре и сохранению — только в режиме разработки.
    if (import.meta.env.DEV) {
      (window as unknown as { __game: Phaser.Game }).__game = game;
      (window as unknown as { __store: ProfileStore }).__store = this.store;
    }
    return game;
  }

  /** До первого экрана: SDK платформы, сохранение (локальное и облачное), dev-параметры, язык и звук. */
  private async startup(): Promise<void> {
    await this.platform.init();
    await this.store.load();
    if (import.meta.env.DEV) (await import('./DevParams')).applyDevParams(this.store);
    this.locale.apply(this.store.profile.lang);
    this.audio.setup(this.store.profile.volume, this.store.profile.muted);
  }
}
