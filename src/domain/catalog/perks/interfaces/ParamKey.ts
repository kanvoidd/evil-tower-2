import type { AbilityId } from './AbilityId';
import type { AbilityParams } from './AbilityParams';

/** Имя любого числа способности (`dmg`, `turns`, `cap` …). */
export type ParamKey = { [A in AbilityId]: keyof AbilityParams[A] }[AbilityId];
