import type { AbilityBehaviorId } from './AbilityBehaviorId';
import type { AbilityBehaviorParams } from './AbilityBehaviorParams';
import type { AbilityDefOf } from './AbilityDef';

type Params<B extends AbilityBehaviorId> = AbilityBehaviorParams[B];

/**
 * Запись способности для `defineAbility`: вид по умолчанию — кнопка. Числа задаются либо одним
 * набором (`params`), либо по уровням перка (`levels`); если у механики есть числа, одно из двух
 * обязательно, и вид чисел проверяется по её id.
 */
export type AbilitySpecOf<B extends AbilityBehaviorId> = Omit<
  AbilityDefOf<B>,
  'kind' | 'params' | 'levels'
> & {
  readonly kind?: AbilityDefOf<B>['kind'];
} & (keyof Params<B> extends never
    ? { readonly params?: Params<B>; readonly levels?: never }
    : | { readonly params: Params<B>; readonly levels?: never }
      | { readonly levels: readonly [Params<B>, ...Params<B>[]]; readonly params?: never });
