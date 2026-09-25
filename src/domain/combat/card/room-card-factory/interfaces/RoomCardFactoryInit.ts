import type { EnemyDef } from '../../../../catalog/enemies';
import type { LineageDef } from '../../../../catalog/heroes';
import type { RoomDef, RoomPlan } from '../../../../catalog/levels';
import type { PlayerStats } from '../../../../progression/stats/stats';
import type { Rng } from '../../../../shared/rng/rng';

/** Что нужно фабрике, чтобы собрать карты одного захода в комнату. */
export interface RoomCardFactoryInit {
  room: RoomDef;
  /** Выпавший расклад комнаты: состав врагов, добыча и модификатор. */
  plan: RoomPlan;
  rng: Rng;
  /** Удача и бонус золота героя меняют номинал золота. */
  stats: PlayerStats;
  /** Каталог врагов, который выпустили фабрики этажей. */
  enemies: Readonly<Record<string, EnemyDef>>;
  /** Линейка героя (фабрика героя): маг находит в комнате артефакты. */
  lineage: LineageDef;
}
