import type { EnemyDef } from '../../../data/enemies';
import type { LineageDef } from '../../../data/heroes';
import type { RoomPlan } from '../../../data/levels';
import type { IEngine } from '../../../engine/interfaces/IEngine';
import type { CardFactory } from '../../../game-data/card/card-factory/CardFactory';

/** Что правила получают готовым от `RunFactory`, а не создают сами. */
export interface RunDeps {
  engine: IEngine;
  cards: CardFactory;
  plan: RoomPlan;
  /** Каталог врагов из фабрик этажей. */
  enemies: Readonly<Record<string, EnemyDef>>;
  /** Линейка героя из его фабрики. */
  lineage: LineageDef;
}
