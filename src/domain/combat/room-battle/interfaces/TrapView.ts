import type { AbilityId } from '../../../catalog';
import type { CellIndex } from '../../../shared';

/** Ловушка глазами сцены: клетка, чем сработает и через сколько ходов (0 — когда придёт враг). */
export interface TrapView {
  readonly cell: CellIndex;
  readonly ability: AbilityId;
  readonly turns: number;
}
