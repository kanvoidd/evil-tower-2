import type { EnemyDef, LineageDef, RoomPlan } from '../../../catalog';
import type { CardFactory } from '../../card/card-factory/CardFactory';
import type { IEngine } from '../../engine/interfaces/IEngine';

/** Что правила получают готовым от `RoomBattleFactory`, а не создают сами. */
export interface BattleDeps {
  engine: IEngine;
  cards: CardFactory;
  plan: RoomPlan;
  /** Каталог врагов из фабрик этажей. */
  enemies: Readonly<Record<string, EnemyDef>>;
  /** Линейка героя из его фабрики. */
  lineage: LineageDef;
}
