import type { EnemyDef } from '../../../catalog/enemies';
import { FLOOR_FACTORIES } from '../../../catalog/floors';
import type { FloorFactory } from '../../../catalog/floors/floor-factory/FloorFactory';
import { HERO_FACTORIES } from '../../../catalog/heroes';
import type { HeroFactory } from '../../../catalog/heroes/hero-factory/HeroFactory';
import { rollRoom } from '../../../catalog/levels';
import { RoomCardFactory } from '../../card/room-card-factory/RoomCardFactory';
import { Engine } from '../../engine/Engine';
import type { RunInit } from '../interfaces/RunInit';
import { Run } from '../Run';

/**
 * Собирает бой в комнате: берёт линейку героя у его фабрики (`HeroFactory`), каталог врагов —
 * у фабрик этажей (`FloorFactory`), и из них делает фабрику карт, движок и правила.
 * Сцена и тесты получают готовый `Run` и не создают его части сами.
 */
export class RunFactory {
  private static shared: RunFactory | null = null;

  private readonly enemies: Readonly<Record<string, EnemyDef>>;

  constructor(
    private readonly heroes: readonly HeroFactory[],
    floors: readonly FloorFactory[],
  ) {
    this.enemies = Object.fromEntries(
      floors.flatMap((f) => f.createEnemies()).map((e) => [e.id, e]),
    );
  }

  /** Фабрика на всех героях и этажах игры. */
  static standard(): RunFactory {
    RunFactory.shared ??= new RunFactory(HERO_FACTORIES, FLOOR_FACTORIES);
    return RunFactory.shared;
  }

  create(init: RunInit): Run {
    const hero = this.heroes.find((h) => h.lineage === init.stats.lineage);
    if (!hero) throw new Error(`нет фабрики героя для линейки ${init.stats.lineage}`);
    const lineage = hero.createLineage();
    const plan = init.plan ?? rollRoom(init.room, init.rng);
    const cards = new RoomCardFactory({
      room: init.room,
      plan,
      rng: init.rng,
      stats: init.stats,
      enemies: this.enemies,
      lineage,
    });
    const engine = new Engine(cards);
    return new Run(init, { engine, cards, plan, enemies: this.enemies, lineage });
  }
}
