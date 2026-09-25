import type { Rng } from '../../../shared';
import type { Card } from '../../card/Card';

/** Удар, для которого решается крит. */
export interface CritRoll {
  /** Цель; `null` — удар без цели на карте. */
  readonly enemy: Card | null;
  /** Выстрел или удар издалека. */
  readonly ranged: boolean;
  /** Удар наносит способность. */
  readonly inAbility: boolean;
  readonly rng: Rng;
}
