import type { AbilityId } from '../../../catalog';
import { Grid } from '../../engine/grid/Grid';
import type { BasicMode } from '../interfaces/BasicMode';
import type { IAttackStrategy } from '../interfaces/IAttackStrategy';

/**
 * Рукой и выстрелом через карту по прямой (лучник). «Косой прицел» добавляет диагонали,
 * «Орлиный глаз» — соседние клетки.
 */
export class ShotAttack implements IAttackStrategy {
  readonly melee = true;
  readonly mode: BasicMode = 'skip';
  readonly mul = 1;
  readonly guaranteedCrit = false;
  readonly style = 'shot' as const;

  reaches(from: number, to: number, passives: ReadonlySet<AbilityId>): boolean {
    if (Grid.dist(from, to) === 2 && Grid.sameLine(from, to)) return true;
    if (passives.has('diagonal') && Grid.diagonals(from).includes(to)) return true;
    if (passives.has('eagle_eye') && Grid.neighbors(from).includes(to)) return true;
    return false;
  }
}
