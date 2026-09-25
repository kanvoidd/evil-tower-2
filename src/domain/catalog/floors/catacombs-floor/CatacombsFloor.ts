import { Percent } from '../../../shared';
import type { EnemyDef } from '../../enemies/interfaces/EnemyDef';
import { FloorFactory } from '../floor-factory/FloorFactory';

/** 2. Катакомбы */
export class CatacombsFloor extends FloorFactory {
  readonly floor = 2;
  readonly theme = 'catacomb';

  createEnemies(): EnemyDef[] {
    return [
      this.enemy('rat_swarm', 'weak', 'beast'),
      this.enemy('goblin', 'normal', 'humanoid'),
      this.enemy('ghost', 'normal', 'undead', {
        evade: Percent.of(20),
        magic: true,
      }),
      this.enemy('orc', 'tough', 'humanoid', { enrage: 0.12 }),
      this.enemy('wraith', 'elite', 'undead', {
        magic: true,
        evade: Percent.of(10),
      }),
      this.enemy('boss_ogre', 'boss', 'humanoid', { enrage: 0.08 }),
    ];
  }
}
