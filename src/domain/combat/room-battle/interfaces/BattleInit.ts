import type { ConsumableId, EquipmentSave, RoomDef, RoomPlan } from '../../../catalog';
import type { Rng } from '../../../shared';
import type { PlayerStats } from '../../player';
import type { BattleCarryStats } from './BattleCarryStats';

/** С чем герой входит в комнату. */
export interface BattleInit {
  room: RoomDef;
  stats: PlayerStats;
  weapon: EquipmentSave | null;
  armor: EquipmentSave | null;
  consumables: Record<ConsumableId, number>;
  rng: Rng;
  /** Готовый расклад (для повторов и тестов); иначе набирается случайно. */
  plan?: RoomPlan;
  /** Забег продолжается из прошлой комнаты: здоровье, ресурс и уже истраченные «раз за забег». */
  carry?: BattleCarryStats;
}
