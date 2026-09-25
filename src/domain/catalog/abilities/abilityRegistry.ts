import { PERKS } from '../perks/perkRegistry';
import type { AbilityBehaviorId } from './interfaces/AbilityBehaviorId';
import type { AbilityDef, AbilityDefOf } from './interfaces/AbilityDef';
import type { AbilityId } from './interfaces/AbilityId';

/**
 * Способности игры — те, что выдают перки классов: способность без класса в игру не попадает.
 * Определения лежат в `heroes/<линейка>/abilities/`, здесь только индексы.
 */
export const ABILITY_LIST: readonly AbilityDef[] = [...new Set(PERKS.map((p) => p.ability))];

export const ABILITY_BY_ID: Readonly<Record<AbilityId, AbilityDef>> = Object.fromEntries(
  ABILITY_LIST.map((a) => [a.id, a]),
);

/** Способность из списка, которую исполняет механика `b` (первая, если их несколько). */
export const withBehavior = <B extends AbilityBehaviorId>(
  list: readonly AbilityDef[],
  b: B,
): AbilityDefOf<B> | undefined => list.find((a) => a.behavior === b) as AbilityDefOf<B> | undefined;

/** Есть ли у способности кнопка на поле боя. */
export const hasButton = (a: AbilityDef): boolean => a.kind === 'button';
