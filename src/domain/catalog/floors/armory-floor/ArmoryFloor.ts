import { Percent } from '../../../shared';
import type { EnemyDef } from '../../enemies/interfaces/EnemyDef';
import { FloorFactory } from '../floor-factory/FloorFactory';

/** 4. Оружейная */
export class ArmoryFloor extends FloorFactory {
  readonly floor = 4;
  readonly theme = 'armory';

  createEnemies(): EnemyDef[] {
    return [
      this.enemy('armored_husk', 'weak', 'construct', {
        armor: 3,
      }),
      this.enemy('blade_dancer', 'normal', 'humanoid', {
        evade: Percent.of(18),
      }),
      this.enemy('crossbowman', 'normal', 'humanoid'),
      this.enemy('iron_sentinel', 'tough', 'construct', {
        armor: 5,
        thorns: 0.15,
      }),
      this.enemy('warden', 'elite', 'humanoid', { enrage: 0.15 }),
      this.enemy('boss_forge_master', 'boss', 'humanoid', {
        armor: 4,
      }),
    ];
  }
}
