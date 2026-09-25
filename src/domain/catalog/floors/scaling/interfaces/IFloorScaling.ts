import type { EnemyRole } from '../../../enemies/interfaces/EnemyRole';
import type { EnemyNumbers } from './EnemyNumbers';
import type { RoomRewards } from './RoomRewards';

/**
 * Рост башни от этажа к этажу: сила и добыча врага по его роли и награда комнаты по её номеру.
 * Фабрики этажей описывают, какие враги и комнаты на этаже, а сколько в них силы и добычи —
 * говорит масштабирование.
 */
export interface IFloorScaling {
  /** Здоровье, атака и добыча врага этой роли на этом этаже. */
  enemy(floor: number, role: EnemyRole): EnemyNumbers;
  /** Множитель золота и бонус за прохождение комнаты `index` (с единицы) на этаже. */
  room(floor: number, index: number, boss: boolean): RoomRewards;
}
