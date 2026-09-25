import { Percent } from '../../../shared';
import type { EnemyDef } from '../../enemies/interfaces/EnemyDef';
import { FloorFactory } from '../floor-factory/FloorFactory';

/** 10. Вершина башни */
export class SummitFloor extends FloorFactory {
  readonly floor = 10;
  readonly theme = 'summit';

  createEnemies(): EnemyDef[] {
    return [
      this.enemy('tower_guard', 'weak', 'humanoid', { armor: 12 }),
      this.enemy('soul_eater', 'normal', 'demon', { venom: 0.3 }),
      this.enemy('golem', 'tough', 'construct', { armor: 24, thorns: 0.2 }),
      this.enemy('dark_knight', 'tough', 'humanoid', {
        enrage: 0.2,
      }),
      this.enemy('void_herald', 'elite', 'demon', {
        magic: true,
        evade: Percent.of(15),
      }),
      this.enemy('boss_demon', 'boss', 'demon', {
        magic: true,
        armor: 18,
        enrage: 0.1,
      }),
    ];
  }
}
