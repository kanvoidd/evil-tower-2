import { CLASSES, LINEAGE_ORDER, type LineageId } from '../../../../catalog';
import { Gold, Souls } from '../../../../shared';
import { emptyHeroSave } from '../../fresh-save/emptyHeroSave';
import type { HeroSave } from '../../interfaces/HeroSave';
import type { LegacySave } from '../interfaces/LegacySave';
import type { SaveMigration } from '../interfaces/SaveMigration';

/**
 * Общий кошелёк → кошельки героев. Раньше кошелёк, расходники и доспех были общими на профиль,
 * а прогресс хранился списком пройденных комнат. Всё общее отдаём той линейке, которой играли;
 * рекорд забега каждой линейки — сколько комнат она уже прошла. Старые поля убираются.
 */
export class SharedWalletToHeroes implements SaveMigration {
  private static readonly LEGACY_KEYS = ['gold', 'souls', 'consumables', 'armor', 'cleared'];

  readonly id = 'shared-wallet-to-heroes';

  applies(doc: LegacySave): boolean {
    return !doc.heroes || SharedWalletToHeroes.LEGACY_KEYS.some((k) => k in doc);
  }

  migrate(doc: LegacySave): void {
    if (!doc.heroes) doc.heroes = SharedWalletToHeroes.heroesOf(doc);
    for (const k of SharedWalletToHeroes.LEGACY_KEYS) delete (doc as Record<string, unknown>)[k];
  }

  private static heroesOf(doc: LegacySave): Partial<Record<LineageId, HeroSave>> {
    const active = CLASSES[doc.activeClass ?? LINEAGE_ORDER[0]].lineage;
    const cleared = Array.isArray(doc.cleared) ? { [active]: doc.cleared } : (doc.cleared ?? {});
    const heroes: Partial<Record<LineageId, HeroSave>> = {};
    for (const lin of LINEAGE_ORDER) {
      const done = (cleared as Partial<Record<LineageId, string[]>>)[lin]?.length ?? 0;
      if (lin !== active && !done && !doc.lineages?.[lin]) continue;
      heroes[lin] =
        lin === active
          ? {
              gold: Gold.of(doc.gold ?? 0),
              souls: Souls.of(doc.souls ?? 0),
              consumables: { ...emptyHeroSave().consumables, ...doc.consumables },
              armor: doc.armor ?? null,
              best: done,
            }
          : { ...emptyHeroSave(), best: done };
    }
    return heroes;
  }
}
