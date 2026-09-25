import { Percent } from '../../../shared';
import type { EnemyDef } from '../../enemies/interfaces/EnemyDef';
import { FloorFactory } from '../floor-factory/FloorFactory';

/** 3. Затопленные ярусы */
export class FloodedFloor extends FloorFactory {
  readonly floor = 3;
  readonly theme = 'flood';

  createEnemies(): EnemyDef[] {
    return [
      this.enemy('mudcrab', 'Грязевой краб', 'Mudcrab', 'weak', 'beast', { armor: 2 }),
      this.enemy('drowned', 'Утопленник', 'Drowned', 'normal', 'undead'),
      this.enemy('deep_hound', 'Глубинный пёс', 'Deep Hound', 'normal', 'beast', {
        evade: Percent.of(12),
      }),
      this.enemy('tide_wraith', 'Дух прилива', 'Tide Wraith', 'tough', 'undead', { magic: true }),
      this.enemy('kraken_spawn', 'Отродье кракена', 'Kraken Spawn', 'elite', 'beast', {
        thorns: 0.2,
      }),
      this.enemy('boss_leviathan', 'Левиафан', 'Leviathan', 'boss', 'beast', { regen: 0.04 }),
    ];
  }
}
