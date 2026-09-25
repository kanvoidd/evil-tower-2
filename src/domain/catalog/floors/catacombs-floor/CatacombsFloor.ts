import type { EnemyDef } from '../../enemies/interfaces/EnemyDef';
import { FloorFactory } from '../floor-factory/FloorFactory';

/** 2. Катакомбы */
export class CatacombsFloor extends FloorFactory {
  readonly floor = 2;
  readonly theme = 'catacomb';

  createEnemies(): EnemyDef[] {
    return [
      this.enemy('rat_swarm', 'Крысиный рой', 'Rat Swarm', 'weak', 'beast'),
      this.enemy('goblin', 'Гоблин', 'Goblin', 'normal', 'humanoid'),
      this.enemy('ghost', 'Призрак', 'Ghost', 'normal', 'undead', { evade: 20, magic: true }),
      this.enemy('orc', 'Орк', 'Orc', 'tough', 'humanoid', { enrage: 0.12 }),
      this.enemy('wraith', 'Тень', 'Wraith', 'elite', 'undead', { magic: true, evade: 10 }),
      this.enemy('boss_ogre', 'Огр-вожак', 'Ogre Chief', 'boss', 'humanoid', { enrage: 0.08 }),
    ];
  }
}
