import { Percent } from '../../../shared';
import type { EnemyDef } from '../../enemies/interfaces/EnemyDef';
import { FloorFactory } from '../floor-factory/FloorFactory';

/** 1. Склеп */
export class CryptFloor extends FloorFactory {
  readonly floor = 1;
  readonly theme = 'crypt';

  createEnemies(): EnemyDef[] {
    return [
      this.enemy('skeleton', 'Скелет', 'Skeleton', 'weak', 'undead'),
      this.enemy('bat', 'Летучая мышь', 'Bat', 'weak', 'beast', { evade: Percent.of(15) }),
      this.enemy('slime', 'Слизень', 'Slime', 'normal', 'beast'),
      this.enemy('skeleton_horned', 'Рогатый скелет', 'Horned Skeleton', 'tough', 'undead'),
      this.enemy('zombie', 'Зомби', 'Zombie', 'elite', 'undead', { regen: 0.08 }),
      this.enemy('boss_skeleton_king', 'Король скелетов', 'Skeleton King', 'boss', 'undead', {
        armor: 1,
      }),
    ];
  }
}
