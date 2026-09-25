import type { LegacySave } from './LegacySave';

/**
 * Шаг переноса сохранения из прошлого формата. Шаги идут по порядку, каждый узнаёт «свой» старый
 * документ сам и меняет его на месте; на документе текущего формата шаг ничего не меняет.
 */
export interface SaveMigration {
  /** Что переносит шаг — для проверок и журнала решений. */
  readonly id: string;
  applies(doc: LegacySave): boolean;
  migrate(doc: LegacySave): void;
}
