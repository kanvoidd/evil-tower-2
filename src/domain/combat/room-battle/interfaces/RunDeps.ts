import type { EnemyDef } from '../../../catalog/enemies';
import type { LineageDef } from '../../../catalog/heroes';
import type { RoomPlan } from '../../../catalog/levels';
import type { CardFactory } from '../../card/card-factory/CardFactory';
import type { IEngine } from '../../engine/interfaces/IEngine';

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
