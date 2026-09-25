import { Percent } from '../../../shared';
import type { EnemyDef } from '../../enemies/interfaces/EnemyDef';
import { FloorFactory } from '../floor-factory/FloorFactory';

/** 7. Ледяные залы */
export class FrostFloor extends FloorFactory {
  readonly floor = 7;
  readonly theme = 'frost';

  createEnemies(): EnemyDef[] {
    return [
      this.enemy('frost_wolf', 'weak', 'beast', {
        evade: Percent.of(16),
      }),
      this.enemy('ice_wraith', 'normal', 'undead', {
        magic: true,
        evade: Percent.of(15),
      }),
      this.enemy('snow_troll', 'tough', 'beast', { regen: 0.12 }),
      this.enemy('frozen_knight', 'tough', 'undead', {
        armor: 9,
      }),
      this.enemy('yeti', 'elite', 'beast', { enrage: 0.2 }),
      this.enemy('boss_ice_queen', 'boss', 'humanoid', {
        magic: true,
        armor: 6,
      }),
    ];
  }
}
