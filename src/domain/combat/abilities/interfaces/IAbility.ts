import type { AbilityId } from '../../../catalog';
import type { Card } from '../../card/Card';
import type { AbilityContext } from './AbilityContext';
import type { AbilityUse } from './AbilityUse';

/**
 * Способность в бою: что она делает, когда её применили. Числа — в `use.perk.params`, общие
 * правила цели (соседний враг, линия, любая карта) проверяет бой, а свои — `targetable`.
 */
export interface IAbility<A extends AbilityId = AbilityId> {
  readonly id: A;
  apply(ctx: AbilityContext, use: AbilityUse<A>): void;
  /** Эффект способности уже держится — второй раз её не применить. */
  active?(ctx: AbilityContext): boolean;
  /** Подходит ли карта в цель сверх общих правил (например, клеймо не вешают дважды). */
  targetable?(card: Card): boolean;
}
