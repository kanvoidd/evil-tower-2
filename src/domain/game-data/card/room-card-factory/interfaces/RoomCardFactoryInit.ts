import type { EnemyDef } from '../../../../data/enemies';
import type { LineageDef } from '../../../../data/heroes';
import type { RoomDef, RoomPlan } from '../../../../data/levels';
import type { Rng } from '../../../../logic/rng';
import type { PlayerStats } from '../../../../logic/stats';

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
