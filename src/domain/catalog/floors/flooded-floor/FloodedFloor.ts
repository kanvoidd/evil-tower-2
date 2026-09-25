import { Percent } from '../../../shared';
import type { EnemyDef } from '../../enemies/interfaces/EnemyDef';
import { FloorFactory } from '../floor-factory/FloorFactory';

/** 3. Затопленные ярусы */
export class FloodedFloor extends FloorFactory {
  readonly floor = 3;
  readonly theme = 'flood';

  createEnemies(): EnemyDef[] {
    return [
      this.enemy('mudcrab', 'weak', 'beast', { armor: 2 }),
      this.enemy('drowned', 'normal', 'undead'),
      this.enemy('deep_hound', 'normal', 'beast', {
        evade: Percent.of(12),
      }),
      this.enemy('tide_wraith', 'tough', 'undead', { magic: true }),
      this.enemy('kraken_spawn', 'elite', 'beast', {
        thorns: 0.2,
      }),
      this.enemy('boss_leviathan', 'boss', 'beast', { regen: 0.04 }),
    ];
  }
}
