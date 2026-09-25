import type { ClassId, PerkSlot } from '../../../catalog';
import type { Souls } from '../../../shared';

/** Цены в опыте душ: всё, что покупается в дереве прокачки, и возврат при отказе от класса. */
export interface ISoulPricing {
  /** Цена ранга `rank` таланта яруса `tier` в классе `owner`. */
  talentRank(owner: ClassId, tier: number, rank: number): Souls;
  /** Сколько стоит прокачать талант с нуля до `rank` включительно. */
  talentTotal(owner: ClassId, tier: number, rank: number): Souls;
  /** Цена способности класса; стартовая бесплатна. */
  perk(owner: ClassId, slot: PerkSlot): Souls;
  /** Цена метаморфозы в класс. */
  metamorphosis(classId: ClassId): Souls;
  /** Сколько возвращает отказ от финального класса, в ветку которого вложено `spent`. */
  refund(spent: number): Souls;
}
