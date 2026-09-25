import type { ConsumableId, EquipmentSave } from '../../../catalog';
import type { Gold, Souls } from '../../../shared';

export interface HeroSave {
  gold: Gold;
  souls: Souls;
  consumables: Record<ConsumableId, number>;
  armor: EquipmentSave | null;
  /** Рекорд: сколько комнат пройдено за один забег. */
  best: number;
}
