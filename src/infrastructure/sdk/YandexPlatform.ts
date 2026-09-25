import type { IPlatform } from '../../application/ports/IPlatform';
import type { Lang } from '../../domain/types';

declare global {
  interface Window {
    YaGames?: { init: (opts?: unknown) => Promise<any> };
  }
}

/**
 * Обёртка над SDK Яндекс Игр. Вне платформы (локальная разработка) работает заглушка:
 * реклама имитируется DOM-оверлеем, данные хранятся только в localStorage.
 * Документация: https://yandex.ru/dev/games/doc/ru/sdk
 */
export class YandexPlatform implements IPlatform {
  ysdk: any = null;
  player: any = null;
  isMock = true;
  private onPause: Array<() => void> = [];
  private onResume: Array<() => void> = [];
  private adOpen = false;
  private gameplayOn = false;

  async init(): Promise<void> {
    if (!window.YaGames) return;
    try {
      this.ysdk = await window.YaGames.init();
      this.isMock = false;
      this.ysdk.on?.('game_api_pause', () => this.onPause.forEach((h) => h()));
      this.ysdk.on?.('game_api_resume', () => this.onResume.forEach((h) => h()));
    } catch (e) {
      console.warn('[YSDK] init failed, using mock', e);
      this.ysdk = null;
      this.isMock = true;
    }
  }

  onGamePause(h: () => void): void {
    this.onPause.push(h);
  }

  onGameResume(h: () => void): void {
    this.onResume.push(h);
  }

  private readyCalled = false;

  /** Сообщает платформе, что игра загружена и готова к взаимодействию (один раз за сессию). */
  ready(): void {
    if (this.readyCalled) return;
    this.readyCalled = true;
    try {
      this.ysdk?.features?.LoadingAPI?.ready?.();
    } catch (e) {
      console.warn('[YSDK] ready failed', e);
    }
  }

  gameplayStart(): void {
    if (this.gameplayOn) return;
    this.gameplayOn = true;
    try {
      this.ysdk?.features?.GameplayAPI?.start?.();
    } catch {
      /* noop */
    }
  }

  gameplayStop(): void {
    if (!this.gameplayOn) return;
    this.gameplayOn = false;
    try {
      this.ysdk?.features?.GameplayAPI?.stop?.();
    } catch {
      /* noop */
    }
  }

  getLang(): Lang {
    const raw: string = this.ysdk?.environment?.i18n?.lang ?? navigator.language ?? 'ru';
    const l = raw.slice(0, 2).toLowerCase();
    return ['ru', 'be', 'kk', 'uk', 'uz', 'hy', 'az', 'ka', 'ky', 'tg', 'tk', 'ro', 'mo'].includes(l) ? 'ru' : 'en';
  }

  // ------------------------------------------------------------------ данные игрока

  async loadCloud(): Promise<unknown | null> {
    if (this.isMock) return null;
    try {
      this.player = await this.ysdk.getPlayer({ scopes: false });
      const data = await this.player.getData();
      return data && Object.keys(data).length ? data : null;
    } catch (e) {
      console.warn('[YSDK] getData failed', e);
      return null;
    }
  }

  async saveCloud(data: unknown): Promise<void> {
    if (this.isMock || !this.player) return;
    try {
      await this.player.setData(data);
    } catch (e) {
      console.warn('[YSDK] setData failed', e);
    }
  }

  async setStats(stats: Record<string, number>): Promise<void> {
    if (this.isMock || !this.player) return;
    try {
      await this.player.setStats(stats);
    } catch {
      /* noop */
    }
  }

  async submitScore(board: string, score: number): Promise<void> {
    if (this.isMock || !this.ysdk) return;
    try {
      const lb = await this.ysdk.getLeaderboards();
      await lb.setScore(board, score);
    } catch {
      /* лидерборд может быть не создан в консоли — это не ошибка игры */
    }
  }

  // ------------------------------------------------------------------ реклама

  /** Полноэкранная реклама в логической паузе. Возвращает true, если реклама была показана. */
  showInterstitial(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.adOpen) return resolve(false);
      this.adOpen = true;
      this.onPause.forEach((h) => h());
      const done = (shown: boolean): void => {
        this.adOpen = false;
        this.onResume.forEach((h) => h());
        resolve(shown);
      };
      if (this.isMock) {
        YandexPlatform.mockAdOverlay('Реклама (заглушка)', false).then(() => done(true));
        return;
      }
      this.ysdk.adv.showFullscreenAdv({
        callbacks: {
          onClose: (wasShown: boolean) => done(!!wasShown),
          onError: () => done(false),
          onOffline: () => done(false),
        },
      });
    });
  }

  /** Реклама с наградой. true — игрок досмотрел и награду нужно выдать. */
  showRewarded(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.adOpen) return resolve(false);
      this.adOpen = true;
      this.onPause.forEach((h) => h());
      let rewarded = false;
      const done = (): void => {
        this.adOpen = false;
        this.onResume.forEach((h) => h());
        resolve(rewarded);
      };
      if (this.isMock) {
        YandexPlatform.mockAdOverlay('Видео с наградой (заглушка)', true).then((ok) => {
          rewarded = ok;
          done();
        });
        return;
      }
      this.ysdk.adv.showRewardedVideo({
        callbacks: {
          onRewarded: () => {
            rewarded = true;
          },
          onClose: () => done(),
          onError: () => done(),
        },
      });
    });
  }

  /** Вне платформы реклама — затемнение с обратным отсчётом (награду можно пропустить). */
  private static mockAdOverlay(title: string, rewarded: boolean): Promise<boolean> {
    return new Promise((resolve) => {
      const el = document.createElement('div');
      el.style.cssText =
        'position:fixed;inset:0;z-index:99999;background:#000c;display:flex;flex-direction:column;gap:18px;align-items:center;justify-content:center;color:#fff;font:700 22px Georgia,serif;text-align:center;';
      let left = 2;
      const label = document.createElement('div');
      label.textContent = `${title} — ${left}`;
      const skip = document.createElement('button');
      skip.textContent = rewarded ? 'Пропустить (без награды)' : 'Закрыть';
      skip.style.cssText = 'font:16px Georgia;padding:8px 16px;';
      el.append(label, skip);
      document.body.appendChild(el);
      const finish = (ok: boolean): void => {
        clearInterval(timer);
        el.remove();
        resolve(ok);
      };
      const timer = window.setInterval(() => {
        left--;
        if (left <= 0) finish(true);
        else label.textContent = `${title} — ${left}`;
      }, 1000);
      skip.onclick = () => finish(!rewarded);
    });
  }
}
