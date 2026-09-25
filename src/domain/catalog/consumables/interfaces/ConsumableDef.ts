import type { LineageId } from '../../heroes/interfaces/LineageId';
import type { ConsumableId } from './ConsumableId';

export interface ConsumableDef {
  id: ConsumableId;
  icon: string;
  price: number;
  /** Можно ли купить в лавке (артефакты только из сундуков). */
  sold: boolean;
  /** Ограничение по линейке (артефакт — только маг). */
  lineage?: LineageId;
  /**
   * Сколько можно держать, покупая в лавке. Здоровье переносится между комнатами забега, и
   * без предела поздний герой брал бы с собой сотню дешёвых зелий — забег перестал бы
   * требовать осторожности. Находки в бою и награды дня предел не проверяют.
   */
  max?: number;
}
