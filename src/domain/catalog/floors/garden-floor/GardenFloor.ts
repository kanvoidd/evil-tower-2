import { Percent } from '../../../shared';
import type { EnemyDef } from '../../enemies/interfaces/EnemyDef';
import { FloorFactory } from '../floor-factory/FloorFactory';

/** 5. Ведьмин сад */
export class GardenFloor extends FloorFactory {
  readonly floor = 5;
  readonly theme = 'garden';

  createEnemies(): EnemyDef[] {
    return [
      this.enemy('thornling', 'weak', 'beast', { thorns: 0.25 }),
      this.enemy('spider', 'normal', 'beast', { venom: 0.2 }),
      this.enemy('wasp_queen', 'normal', 'beast', {
        evade: Percent.of(22),
      }),
      this.enemy('vine_horror', 'tough', 'beast', { regen: 0.1 }),
      this.enemy('dryad', 'elite', 'beast', { magic: true, regen: 0.06 }),
      this.enemy('boss_witch', 'boss', 'humanoid', {
        magic: true,
        venom: 0.15,
      }),
    ];
  }
}
