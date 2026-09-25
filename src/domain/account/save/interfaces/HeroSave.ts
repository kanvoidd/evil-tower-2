import type { ConsumableId, EquipmentSave } from '../../../catalog';

export interface HeroSave {
  gold: number;
  souls: number;
  consumables: Record<ConsumableId, number>;
  armor: EquipmentSave | null;
  /** Рекорд: сколько комнат пройдено за один забег. */
  best: number;
}
