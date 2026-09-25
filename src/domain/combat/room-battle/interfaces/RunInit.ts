import type { RoomDef, RoomPlan } from '../../../catalog/levels';
import type { Rng } from '../../../shared/rng/rng';
import type { ConsumableId, EquipmentSave } from '../../../types';
import type { PlayerStats } from '../../player';
import type { RunCarryStats } from './RunCarryStats';

/** С чем герой входит в комнату. */
export interface RunInit {
  room: RoomDef;
  stats: PlayerStats;
  weapon: EquipmentSave | null;
  armor: EquipmentSave | null;
  consumables: Record<ConsumableId, number>;
  rng: Rng;
  /** Готовый расклад (для повторов и тестов); иначе набирается случайно. */
  plan?: RoomPlan;
  /** Забег продолжается из прошлой комнаты: здоровье, ресурс и уже истраченные «раз за забег». */
  carry?: RunCarryStats;
}
