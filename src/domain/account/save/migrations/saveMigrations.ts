import { PerItemAutoUse } from './automation/PerItemAutoUse';
import type { SaveMigration } from './interfaces/SaveMigration';
import { ProfessionRework } from './profession-rework/ProfessionRework';
import { SharedWalletToHeroes } from './shared-wallet/SharedWalletToHeroes';

/** Шаги переноса старых сохранений — по порядку; новый шаг добавляется в конец. */
export const SAVE_MIGRATIONS: readonly SaveMigration[] = [
  new PerItemAutoUse(),
  new SharedWalletToHeroes(),
  new ProfessionRework(),
];
