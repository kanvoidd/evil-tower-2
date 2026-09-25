import type { AbilityBehaviorId } from './AbilityBehaviorId';
import type { AbilityBehaviorParams } from './AbilityBehaviorParams';

/** Имя любого числа способности (`dmg`, `turns`, `cap` …). */
export type ParamKey = {
  [B in AbilityBehaviorId]: keyof AbilityBehaviorParams[B];
}[AbilityBehaviorId];
