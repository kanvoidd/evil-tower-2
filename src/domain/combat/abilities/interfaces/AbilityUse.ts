import type { AbilityId, PerkDefOf } from '../../../catalog';
import type { CellIndex } from '../../../shared';
import type { Card } from '../../card/Card';

/** Одно применение способности: её определение, цель и поле в момент применения. */
export interface AbilityUse<A extends AbilityId> {
  readonly perk: PerkDefOf<A>;
  /** Клетка цели; `Grid.NO_CELL` — способность на себя. */
  readonly cell: CellIndex;
  /** Карта на клетке цели в момент применения. */
  readonly target: Card | null;
  /** Враги на поле в момент применения. */
  readonly enemies: CellIndex[];
}
