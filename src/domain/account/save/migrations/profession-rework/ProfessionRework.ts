import { baseClassOf, CLASSES, type ClassId, type LineageId } from '../../../../catalog';
import { newLineageSave, TREES } from '../../../../progression';
import type { LegacySave } from '../interfaces/LegacySave';
import type { SaveMigration } from '../interfaces/SaveMigration';
import { lineageOfSaved } from '../legacy/legacyClasses';
import { PROFESSION_TREES } from './professionTrees';

/**
 * Профессиональное развитие мага и охотника: их деревья построены заново (подклассы, ветки,
 * «Основа»), и прежние ранги легли бы на чужие места. Прогресс дерева этих линеек начинается с
 * базового класса, души и снаряжение героя остаются; активный класс, которого больше нет, —
 * базовый класс своей линейки.
 */
export class ProfessionRework implements SaveMigration {
  /** Линейки, чьи деревья перестроены в этой версии. */
  private static readonly REWORKED: readonly LineageId[] = ['mage', 'archer'];

  readonly id = 'profession-rework';

  applies(doc: LegacySave): boolean {
    return (doc.treeVersion ?? 1) < PROFESSION_TREES;
  }

  migrate(doc: LegacySave): void {
    const lineages = { ...doc.lineages };
    for (const lin of ProfessionRework.REWORKED)
      if (lineages[lin]) lineages[lin] = newLineageSave(TREES[lin]);
    doc.lineages = lineages;
    const active = doc.activeClass as string | null | undefined;
    if (active) {
      const lin = lineageOfSaved(active);
      if (ProfessionRework.REWORKED.includes(lin) || !CLASSES[active as ClassId])
        doc.activeClass = baseClassOf(lin);
    }
    doc.treeVersion = PROFESSION_TREES;
  }
}
