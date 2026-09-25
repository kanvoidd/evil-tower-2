import { FLOOR_FACTORIES } from '../floors/floorRegistry';
import type { EnemyDef } from './interfaces/EnemyDef';
import type { EnemyRole } from './interfaces/EnemyRole';

/**
 * Врагов выпускают фабрики этажей (src/domain/catalog/floors) — здесь только реестр.
 */
export const ENEMY_LIST: EnemyDef[] = FLOOR_FACTORIES.flatMap((f) => f.createEnemies());

export const ENEMIES: Record<string, EnemyDef> = Object.fromEntries(
  ENEMY_LIST.map((e) => [e.id, e]),
);

export const enemiesOfFloor = (floor: number, role?: EnemyRole): EnemyDef[] =>
  ENEMY_LIST.filter((e) => e.floor === floor && (!role || e.role === role));

export const bossOfFloor = (floor: number): EnemyDef => enemiesOfFloor(floor, 'boss')[0];
