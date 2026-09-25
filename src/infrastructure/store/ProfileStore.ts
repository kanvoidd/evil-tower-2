import type { IProfileStorage } from '../../application/ports/IProfileStorage';
import { CLASSES } from '../../domain/data/classes';
import { LINEAGE_ORDER } from '../../domain/data/heroes';
import { DEFAULT_AUTO_USE } from '../../domain/logic/autoUse';
import { Profile } from '../../domain/logic/profile';
import type { AutoUseSave, EquipmentSave, HeroSave, LineageId, SaveData } from '../../domain/types';
import type { CloudSaves } from './interfaces/CloudSaves';

/**
 * Сохранения: локально сразу и в облако Яндекса не чаще раза в 6 секунд (побеждает более свежее),
 * принудительная запись при скрытии вкладки. Правил игры здесь нет — они в `Profile`;
 * хранилище лишь загружает документ, переносит старые форматы и записывает изменения.
 */
export class ProfileStore implements IProfileStorage {
  private static readonly KEY = 'et2_save_v2';
  /** Версия 2: новое дерево талантов и способности-кнопки — прежние сохранения несовместимы. */
  private static readonly VERSION = 2;

  /** Правила профиля над загруженным документом. */
  readonly profile = new Profile(Profile.freshData('ru', Date.now()), () => Date.now());
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
    let local: SaveData | null = null;
    try {
      const raw = localStorage.getItem(ProfileStore.KEY);
      if (raw) local = JSON.parse(raw) as SaveData;
    } catch {
      local = null;
    }
    const cloud = (await this.cloud.loadCloud()) as SaveData | null;
    const pick = [local, cloud].filter(
      (x): x is SaveData => !!x && typeof x === 'object' && x.v === ProfileStore.VERSION,
    );
    pick.sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0));
    const base = Profile.freshData('ru', Date.now());
    const data = pick.length ? this.merge(base, pick[0]) : base;
    if (!pick.length) data.lang = this.cloud.getLang();
    this.profile.replace(data);
    window.addEventListener('pagehide', () => this.flush());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.flush();
    });
  }

  private merge(base: SaveData, src: SaveData): SaveData {
    const out: SaveData = { ...base, ...src };
    out.stats = { ...base.stats, ...src.stats };
    out.tutorial = { ...base.tutorial, ...src.tutorial };
    out.daily = { ...base.daily, ...src.daily };
    out.gift = { ...base.gift, ...src.gift };
    out.ads = { ...base.ads, ...src.ads };
    // Старые сохранения не знают про автоприменение и автопрокачку — подставляем значения по умолчанию.
    // Раньше у автоприменения был общий переключатель `on`: если он был выключен, все расходники остаются выключенными.
    const auto = (src as Partial<SaveData>).auto as
      | { use?: Partial<AutoUseSave> & { on?: boolean }; skill?: SaveData['auto']['skill'] }
      | undefined;
    const use: AutoUseSave = {
      heal: !!auto?.use?.heal,
      regen: !!auto?.use?.regen,
      artifact: !!auto?.use?.artifact,
    };
    if (auto?.use?.on === false) Object.assign(use, DEFAULT_AUTO_USE);
    out.auto = { use, skill: { ...auto?.skill } };
    out.lineages = { ...src.lineages };
    out.heroes = { ...src.heroes };
    // Раньше кошелёк, расходники и доспех были общими на профиль, а прогресс хранился
    // списком пройденных комнат. Всё общее отдаём той линейке, которой играли; рекорд
    // забега каждой линейки — сколько комнат она уже прошла.
    const old = src as unknown as {
      gold?: number;
      souls?: number;
      consumables?: HeroSave['consumables'];
      armor?: EquipmentSave | null;
      cleared?: string[] | Partial<Record<LineageId, string[]>>;
    };
    if (!src.heroes) {
      const active = CLASSES[src.activeClass ?? LINEAGE_ORDER[0]].lineage;
      const cleared = Array.isArray(old.cleared) ? { [active]: old.cleared } : (old.cleared ?? {});
      for (const lin of LINEAGE_ORDER) {
        const done = (cleared as Partial<Record<LineageId, string[]>>)[lin]?.length ?? 0;
        if (lin !== active && !done && !src.lineages?.[lin]) continue;
        out.heroes[lin] =
          lin === active
            ? {
                gold: old.gold ?? 0,
                souls: old.souls ?? 0,
                consumables: { ...Profile.emptyHero().consumables, ...old.consumables },
                armor: old.armor ?? null,
                best: done,
              }
            : { ...Profile.emptyHero(), best: done };
      }
    }
    for (const k of ['gold', 'souls', 'consumables', 'armor', 'cleared'])
      delete (out as unknown as Record<string, unknown>)[k];
    return out;
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
    this.profile.replace(Profile.freshData(this.cloud.getLang(), Date.now()));
    this.flush();
  }
}
