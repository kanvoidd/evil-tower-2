import { Percent } from '../../../shared';
import type { EnemyDef } from '../../enemies/interfaces/EnemyDef';
import { FloorFactory } from '../floor-factory/FloorFactory';

/** 8. Кузня демонов */
export class ForgeFloor extends FloorFactory {
  readonly floor = 8;
  readonly theme = 'forge';

  createEnemies(): EnemyDef[] {
    return [
      this.enemy('imp', 'weak', 'demon', { evade: Percent.of(14) }),
      this.enemy('hellhound', 'normal', 'demon', { venom: 0.25 }),
      this.enemy('magma_golem', 'tough', 'construct', {
        armor: 12,
        thorns: 0.25,
      }),
      this.enemy('demon_smith', 'tough', 'demon', { enrage: 0.15 }),
      this.enemy('brimstone_brute', 'elite', 'demon', {
        venom: 0.2,
        armor: 8,
      }),
      this.enemy('boss_forge_demon', 'boss', 'demon', {
        thorns: 0.2,
        armor: 10,
      }),
    ];
  }
}
