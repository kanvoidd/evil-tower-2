import type { EnemyDef } from '../../enemies/interfaces/EnemyDef';
import { FloorFactory } from '../floor-factory/FloorFactory';

/** 9. Библиотека проклятых */
export class LibraryFloor extends FloorFactory {
  readonly floor = 9;
  readonly theme = 'library';

  createEnemies(): EnemyDef[] {
    return [
      this.enemy('cursed_tome', 'Проклятый том', 'Cursed Tome', 'weak', 'construct', {
        magic: true,
      }),
      this.enemy('shadow', 'Тень чтеца', 'Reader’s Shadow', 'normal', 'undead', { evade: 25 }),
      this.enemy('gargoyle', 'Горгулья', 'Gargoyle', 'tough', 'construct', { armor: 16 }),
      this.enemy('lich_scribe', 'Лич-переписчик', 'Lich Scribe', 'tough', 'undead', {
        magic: true,
        regen: 0.08,
      }),
      this.enemy('archivist', 'Архивариус', 'Archivist', 'elite', 'undead', {
        magic: true,
        armor: 10,
      }),
      this.enemy('boss_lich', 'Лич-хранитель', 'Keeper Lich', 'boss', 'undead', {
        magic: true,
        regen: 0.06,
      }),
    ];
  }
}
