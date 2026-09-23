import type { EnemyDef } from '../../enemies/interfaces/EnemyDef';
import { FloorFactory } from '../floor-factory/FloorFactory';

/** 5. Ведьмин сад */
export class GardenFloor extends FloorFactory {
  readonly floor = 5;
  readonly theme = 'garden';

  createEnemies(): EnemyDef[] {
    return [
      this.enemy('thornling', 'Колючка', 'Thornling', 'weak', 'beast', { thorns: 0.25 }),
      this.enemy('spider', 'Паук', 'Spider', 'normal', 'beast', { venom: 0.2 }),
      this.enemy('wasp_queen', 'Оса-матка', 'Wasp Queen', 'normal', 'beast', { evade: 22 }),
      this.enemy('vine_horror', 'Лозовый ужас', 'Vine Horror', 'tough', 'beast', { regen: 0.1 }),
      this.enemy('dryad', 'Дриада', 'Dryad', 'elite', 'beast', { magic: true, regen: 0.06 }),
      this.enemy('boss_witch', 'Ведьма сада', 'Garden Witch', 'boss', 'humanoid', { magic: true, venom: 0.15 }),
    ];
  }
}
