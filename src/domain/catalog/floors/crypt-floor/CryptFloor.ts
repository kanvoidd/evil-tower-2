import { Percent } from '../../../shared';
import type { EnemyDef } from '../../enemies/interfaces/EnemyDef';
import { FloorFactory } from '../floor-factory/FloorFactory';

/** 1. Склеп */
export class CryptFloor extends FloorFactory {
  readonly floor = 1;
  readonly theme = 'crypt';

  createEnemies(): EnemyDef[] {
    return [
      this.enemy('skeleton', 'weak', 'undead'),
      this.enemy('bat', 'weak', 'beast', { evade: Percent.of(15) }),
      this.enemy('slime', 'normal', 'beast'),
      this.enemy('skeleton_horned', 'tough', 'undead'),
      this.enemy('zombie', 'elite', 'undead', { regen: 0.08 }),
      this.enemy('boss_skeleton_king', 'boss', 'undead', {
        armor: 1,
      }),
    ];
  }
}
