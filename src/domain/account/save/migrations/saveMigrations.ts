import { PerItemAutoUse } from './automation/PerItemAutoUse';
import type { SaveMigration } from './interfaces/SaveMigration';
import { SharedWalletToHeroes } from './shared-wallet/SharedWalletToHeroes';

/** Шаги переноса старых сохранений — по порядку; новый шаг добавляется в конец. */
export const SAVE_MIGRATIONS: readonly SaveMigration[] = [
  new PerItemAutoUse(),
  new SharedWalletToHeroes(),
];
