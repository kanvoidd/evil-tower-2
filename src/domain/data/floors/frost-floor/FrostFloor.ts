import type { EnemyDef } from '../../enemies/interfaces/EnemyDef';
import { FloorFactory } from '../floor-factory/FloorFactory';

/** 7. Ледяные залы */
export class FrostFloor extends FloorFactory {
  readonly floor = 7;
  readonly theme = 'frost';

  createEnemies(): EnemyDef[] {
    return [
      this.enemy('frost_wolf', 'Морозный волк', 'Frost Wolf', 'weak', 'beast', { evade: 16 }),
      this.enemy('ice_wraith', 'Ледяной дух', 'Ice Wraith', 'normal', 'undead', { magic: true, evade: 15 }),
      this.enemy('snow_troll', 'Снежный тролль', 'Snow Troll', 'tough', 'beast', { regen: 0.12 }),
      this.enemy('frozen_knight', 'Скованный льдом рыцарь', 'Frozen Knight', 'tough', 'undead', { armor: 9 }),
      this.enemy('yeti', 'Йети', 'Yeti', 'elite', 'beast', { enrage: 0.2 }),
      this.enemy('boss_ice_queen', 'Ледяная королева', 'Ice Queen', 'boss', 'humanoid', { magic: true, armor: 6 }),
    ];
  }
}
