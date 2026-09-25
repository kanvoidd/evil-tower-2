import type { ConsumableDef } from '../../../domain/catalog/consumables';

/** Строка расходника в лавке. */
export interface ConsumableOffer {
  def: ConsumableDef;
  /** Сколько уже у героя. */
  owned: number;
  /** Запас полон — лавка больше не продаёт. */
  full: boolean;
}
