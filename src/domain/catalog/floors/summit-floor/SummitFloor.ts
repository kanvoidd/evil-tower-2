import { Percent } from '../../../shared';
import type { EnemyDef } from '../../enemies/interfaces/EnemyDef';
import { FloorFactory } from '../floor-factory/FloorFactory';

/** 10. Вершина башни */
export class SummitFloor extends FloorFactory {
  readonly floor = 10;
  readonly theme = 'summit';

  createEnemies(): EnemyDef[] {
    return [
      this.enemy('tower_guard', 'Страж башни', 'Tower Guard', 'weak', 'humanoid', { armor: 12 }),
      this.enemy('soul_eater', 'Пожиратель душ', 'Soul Eater', 'normal', 'demon', { venom: 0.3 }),
      this.enemy('golem', 'Голем', 'Golem', 'tough', 'construct', { armor: 24, thorns: 0.2 }),
      this.enemy('dark_knight', 'Тёмный рыцарь', 'Dark Knight', 'tough', 'humanoid', {
        enrage: 0.2,
      }),
      this.enemy('void_herald', 'Вестник пустоты', 'Void Herald', 'elite', 'demon', {
        magic: true,
        evade: Percent.of(15),
      }),
      this.enemy('boss_demon', 'Владыка башни', 'Tower Lord', 'boss', 'demon', {
        magic: true,
        armor: 18,
        enrage: 0.1,
      }),
    ];
  }
}
