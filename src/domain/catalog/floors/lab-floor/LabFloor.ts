import type { EnemyDef } from '../../enemies/interfaces/EnemyDef';
import { FloorFactory } from '../floor-factory/FloorFactory';

/** 6. Алхимическая лаборатория */
export class LabFloor extends FloorFactory {
  readonly floor = 6;
  readonly theme = 'lab';

  createEnemies(): EnemyDef[] {
    return [
      this.enemy('homunculus', 'weak', 'construct'),
      this.enemy('acid_slime', 'normal', 'beast', {
        venom: 0.25,
      }),
      this.enemy('flask_golem', 'normal', 'construct', {
        armor: 6,
      }),
      this.enemy('mutant', 'tough', 'beast', { enrage: 0.18 }),
      this.enemy('plague_doctor', 'elite', 'humanoid', {
        magic: true,
        venom: 0.3,
      }),
      this.enemy('boss_alchemist', 'boss', 'humanoid', {
        magic: true,
        regen: 0.05,
      }),
    ];
  }
}
