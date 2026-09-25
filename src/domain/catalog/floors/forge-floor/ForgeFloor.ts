import { Percent } from '../../../shared';
import type { EnemyDef } from '../../enemies/interfaces/EnemyDef';
import { FloorFactory } from '../floor-factory/FloorFactory';

/** 8. Кузня демонов */
export class ForgeFloor extends FloorFactory {
  readonly floor = 8;
  readonly theme = 'forge';

  createEnemies(): EnemyDef[] {
    return [
      this.enemy('imp', 'Бес', 'Imp', 'weak', 'demon', { evade: Percent.of(14) }),
      this.enemy('hellhound', 'Адская гончая', 'Hellhound', 'normal', 'demon', { venom: 0.25 }),
      this.enemy('magma_golem', 'Магмовый голем', 'Magma Golem', 'tough', 'construct', {
        armor: 12,
        thorns: 0.25,
      }),
      this.enemy('demon_smith', 'Демон-кузнец', 'Demon Smith', 'tough', 'demon', { enrage: 0.15 }),
      this.enemy('brimstone_brute', 'Серный громила', 'Brimstone Brute', 'elite', 'demon', {
        venom: 0.2,
        armor: 8,
      }),
      this.enemy('boss_forge_demon', 'Владыка кузни', 'Lord of the Forge', 'boss', 'demon', {
        thorns: 0.2,
        armor: 10,
      }),
    ];
  }
}
