import type { AbilityBehaviorId, AbilityDefOf } from '../../../catalog';
import type { CellIndex } from '../../../shared';
import type { Card } from '../../card/Card';
import type { AbilityContext } from './AbilityContext';
import type { AbilityUse } from './AbilityUse';

/**
 * Механика способности с кнопкой: что она делает, когда способность применили. Числа — в
 * `use.ability.params` (их задаёт определение способности), общие правила цели (соседний враг,
 * линия, любая карта) проверяет бой, а свои — `targetable`. Одну механику могут исполнять
 * несколько способностей с разными числами.
 */
export interface IAbility<B extends AbilityBehaviorId = AbilityBehaviorId> {
  readonly behavior: B;
  apply(ctx: AbilityContext, use: AbilityUse<B>): void;
  /** Эффект способности уже держится — второй раз её не применить. */
  active?(ctx: AbilityContext, ability: AbilityDefOf<B>): boolean;
  /** Подходит ли карта в цель сверх общих правил (например, клеймо не вешают дважды). */
  targetable?(card: Card, ability: AbilityDefOf<B>): boolean;
  /** Подходит ли клетка в цель сверх общих правил (например, пробежка только по линии героя). */
  targetOk?(ctx: AbilityContext, ability: AbilityDefOf<B>, cell: CellIndex): boolean;
}
