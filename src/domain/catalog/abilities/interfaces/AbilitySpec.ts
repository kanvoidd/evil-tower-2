import type { AbilityBehaviorId } from './AbilityBehaviorId';
import type { AbilityBehaviorParams } from './AbilityBehaviorParams';
import type { AbilityDefOf } from './AbilityDef';

/**
 * Запись способности для `defineAbility`: вид по умолчанию — кнопка; числа (`params`) обязательны,
 * если они у механики есть, и проверяются по её id.
 */
export type AbilitySpecOf<B extends AbilityBehaviorId> = Omit<
  AbilityDefOf<B>,
  'kind' | 'params'
> & {
  readonly kind?: AbilityDefOf<B>['kind'];
} & (keyof AbilityBehaviorParams[B] extends never
    ? { readonly params?: AbilityBehaviorParams[B] }
    : { readonly params: AbilityBehaviorParams[B] });
