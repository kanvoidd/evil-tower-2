import { type AutoUseSave, DEFAULT_AUTO_USE } from '../../../../combat';
import type { LegacySave } from '../interfaces/LegacySave';
import type { SaveMigration } from '../interfaces/SaveMigration';

/**
 * Автоматизация: старые сохранения не знают про автоприменение и автопрокачку — подставляем
 * значения по умолчанию. Раньше у автоприменения был общий переключатель `on`: если он был
 * выключен, все расходники остаются выключенными. Шаг выполняется всегда и заодно приводит
 * переключатели к `true`/`false`.
 */
export class PerItemAutoUse implements SaveMigration {
  readonly id = 'per-item-auto-use';

  applies(): boolean {
    return true;
  }

  migrate(doc: LegacySave): void {
    const auto = doc.auto;
    const use: AutoUseSave = {
      heal: !!auto?.use?.heal,
      regen: !!auto?.use?.regen,
      artifact: !!auto?.use?.artifact,
    };
    if (auto?.use?.on === false) Object.assign(use, DEFAULT_AUTO_USE);
    doc.auto = { use, skill: { ...auto?.skill } };
  }
}
