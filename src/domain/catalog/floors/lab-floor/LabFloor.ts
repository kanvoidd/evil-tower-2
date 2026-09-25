import type { EnemyDef } from '../../enemies/interfaces/EnemyDef';
import { FloorFactory } from '../floor-factory/FloorFactory';

/** 6. Алхимическая лаборатория */
export class LabFloor extends FloorFactory {
  readonly floor = 6;
  readonly theme = 'lab';

  createEnemies(): EnemyDef[] {
    return [
      this.enemy('homunculus', 'Гомункул', 'Homunculus', 'weak', 'construct'),
      this.enemy('acid_slime', 'Кислотный слизень', 'Acid Slime', 'normal', 'beast', {
        venom: 0.25,
      }),
      this.enemy('flask_golem', 'Колбяной голем', 'Flask Golem', 'normal', 'construct', {
        armor: 6,
      }),
      this.enemy('mutant', 'Мутант', 'Mutant', 'tough', 'beast', { enrage: 0.18 }),
      this.enemy('plague_doctor', 'Чумной доктор', 'Plague Doctor', 'elite', 'humanoid', {
        magic: true,
        venom: 0.3,
      }),
      this.enemy('boss_alchemist', 'Алхимик башни', 'Tower Alchemist', 'boss', 'humanoid', {
        magic: true,
        regen: 0.05,
      }),
    ];
  }
}
