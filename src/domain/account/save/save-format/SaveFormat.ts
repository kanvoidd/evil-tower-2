import type { Lang } from '../../../shared';
import { freshSave } from '../fresh-save/freshSave';
import type { SaveData } from '../interfaces/SaveData';
import type { LegacySave } from '../migrations/interfaces/LegacySave';
import { SAVE_MIGRATIONS } from '../migrations/saveMigrations';

/**
 * Формат сохранения: какая версия читается, какое из нескольких сохранений главнее, как старый
 * документ приводится к текущему (шаги `SAVE_MIGRATIONS`, затем недостающее — по умолчанию).
 */
export class SaveFormat {
  /** Версия 2: новое дерево талантов и способности-кнопки — прежние сохранения несовместимы. */
  static readonly VERSION = 2;

  /** Документ нового игрока. */
  static fresh(lang: Lang, now: number): SaveData {
    return freshSave(lang, now);
  }

  /** Документ читается: объект текущей версии. */
  static accepts(raw: unknown): raw is LegacySave {
    return !!raw && typeof raw === 'object' && (raw as LegacySave).v === SaveFormat.VERSION;
  }

  /** Из нескольких сохранений (локальное, облачное) побеждает более свежее; при равенстве — первое. */
  static newest(candidates: readonly unknown[]): LegacySave | null {
    const ok = candidates.filter((x): x is LegacySave => SaveFormat.accepts(x));
    ok.sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0));
    return ok[0] ?? null;
  }

  /** Старый документ → текущий формат: шаги переноса по порядку, затем значения по умолчанию. */
  static restore(raw: LegacySave, now: number): SaveData {
    const doc: LegacySave = { ...raw };
    for (const m of SAVE_MIGRATIONS) if (m.applies(doc)) m.migrate(doc);
    return SaveFormat.withDefaults(doc, freshSave('ru', now));
  }

  /** Недостающие поля — из документа нового игрока, вложенные группы — по полю. */
  private static withDefaults(doc: LegacySave, base: SaveData): SaveData {
    const out = { ...base, ...doc } as SaveData;
    out.stats = { ...base.stats, ...doc.stats };
    out.tutorial = { ...base.tutorial, ...doc.tutorial };
    out.daily = { ...base.daily, ...doc.daily };
    out.gift = { ...base.gift, ...doc.gift };
    out.ads = { ...base.ads, ...doc.ads };
    out.lineages = { ...doc.lineages };
    out.heroes = { ...doc.heroes };
    return out;
  }
}
