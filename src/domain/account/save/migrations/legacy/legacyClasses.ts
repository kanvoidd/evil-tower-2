import { CLASSES, type ClassId, LINEAGE_ORDER, type LineageId } from '../../../../catalog';

/**
 * Классы прошлых версий, которых больше нет, — и их линейки: старые сохранения ещё называют их
 * активным классом.
 */
const LEGACY_CLASS_LINEAGE: Readonly<Record<string, LineageId>> = {
  necromancer: 'mage',
  pyromancer: 'mage',
  archer: 'archer',
  hawkeye: 'archer',
  arrowgod: 'archer',
  sniper: 'archer',
};

/** Линейка класса из сохранения — и нынешнего, и прошлых версий. */
export const lineageOfSaved = (classId: string): LineageId =>
  CLASSES[classId as ClassId]?.lineage ?? LEGACY_CLASS_LINEAGE[classId] ?? LINEAGE_ORDER[0];
