import { Percent } from '../../../shared';
import type { EnemyDef } from '../../enemies/interfaces/EnemyDef';
import { FloorFactory } from '../floor-factory/FloorFactory';

/** 9. Библиотека проклятых */
export class LibraryFloor extends FloorFactory {
  readonly floor = 9;
  readonly theme = 'library';

  createEnemies(): EnemyDef[] {
    return [
      this.enemy('cursed_tome', 'weak', 'construct', {
        magic: true,
      }),
      this.enemy('shadow', 'normal', 'undead', {
        evade: Percent.of(25),
      }),
      this.enemy('gargoyle', 'tough', 'construct', { armor: 16 }),
      this.enemy('lich_scribe', 'tough', 'undead', {
        magic: true,
        regen: 0.08,
      }),
      this.enemy('archivist', 'elite', 'undead', {
        magic: true,
        armor: 10,
      }),
      this.enemy('boss_lich', 'boss', 'undead', {
        magic: true,
        regen: 0.06,
      }),
    ];
  }
}
