import type { IProfileStorage } from '../../application/ports/IProfileStorage';
import { Profile, type SaveData,SaveFormat } from '../../domain/account';
import { LocalCalendar } from '../time/LocalCalendar';
import type { CloudSaves } from './interfaces/CloudSaves';

/**
 * Сохранения: локально сразу и в облако Яндекса не чаще раза в 6 секунд, принудительная запись
 * при скрытии вкладки. Правил здесь нет: игры — в `Profile`, формата сохранения (какое главнее,
 * перенос старых форматов) — в `SaveFormat`; хранилище только читает и записывает.
 */
export class ProfileStore implements IProfileStorage {
  private static readonly KEY = 'et2_save_v2';

  /** Правила профиля над загруженным документом. */
  readonly profile = new Profile(
    SaveFormat.fresh('ru', Date.now()),
    () => Date.now(),
    new LocalCalendar(),
  );
  private saveTimer: number | null = null;
  private cloudTimer: number | null = null;
  private dirtyCloud = false;

  constructor(private readonly cloud: CloudSaves) {
    this.profile.changed.on(() => this.save());
  }

  /** Документ сохранения (правила — в `profile`). */
  get data(): SaveData {
    return this.profile.data;
  }

  // ------------------------------------------------------------------ загрузка/сохранение

  async load(): Promise<void> {
    let local: unknown = null;
    try {
      const raw = localStorage.getItem(ProfileStore.KEY);
      if (raw) local = JSON.parse(raw);
    } catch {
      local = null;
    }
    const newest = SaveFormat.newest([local, await this.cloud.loadCloud()]);
    const data = newest
      ? SaveFormat.restore(newest, Date.now())
      : SaveFormat.fresh(this.cloud.getLang(), Date.now());
    this.profile.replace(data);
    window.addEventListener('pagehide', () => this.flush());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.flush();
    });
  }

  /** Отложенное сохранение: локально почти сразу, в облако — не чаще раза в 6 секунд. */
  save(): void {
    if (this.saveTimer) return;
    this.saveTimer = window.setTimeout(() => {
      this.saveTimer = null;
      this.writeLocal();
    }, 250);
    this.dirtyCloud = true;
    if (!this.cloudTimer) {
      this.cloudTimer = window.setTimeout(() => {
        this.cloudTimer = null;
        if (this.dirtyCloud) this.flushCloud();
      }, 6000);
    }
  }

  private writeLocal(): void {
    this.data.savedAt = Date.now();
    try {
      localStorage.setItem(ProfileStore.KEY, JSON.stringify(this.data));
    } catch {
      /* приватный режим — прогресс будет только в облаке */
    }
  }

  private flushCloud(): void {
    this.dirtyCloud = false;
    void this.cloud.saveCloud(this.data);
  }

  flush(): void {
    if (this.saveTimer) {
      window.clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    this.writeLocal();
    if (this.dirtyCloud) this.flushCloud();
  }

  reset(): void {
    this.profile.replace(SaveFormat.fresh(this.cloud.getLang(), Date.now()));
    this.flush();
  }
}
