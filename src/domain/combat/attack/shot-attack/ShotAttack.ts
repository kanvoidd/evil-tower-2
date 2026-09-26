import type { CellIndex } from '../../../shared';
import { Grid } from '../../engine/grid/Grid';
import type { BasicMode } from '../interfaces/BasicMode';
import type { IAttackStrategy } from '../interfaces/IAttackStrategy';

/**
 * Рукой и выстрелом через карту по прямой — стиль базовых перков охотника («Сквозной выстрел»,
 * «Залп болтом»).
 */
export class ShotAttack implements IAttackStrategy {
  readonly melee = true;
  readonly mode: BasicMode = 'skip';
  readonly mul = 1;
  readonly guaranteedCrit = false;
  readonly style = 'shot' as const;

  reaches(from: CellIndex, to: CellIndex): boolean {
    return Grid.dist(from, to) === 2 && Grid.sameLine(from, to);
  }
}
