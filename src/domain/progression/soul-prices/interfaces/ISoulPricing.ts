import type { ClassId, PerkDef, TalentPlace } from '../../../catalog';
import type { Souls } from '../../../shared';

/** Цены в опыте душ: всё, что покупается в дереве прокачки, и возврат при отказе от класса. */
export interface ISoulPricing {
  /** Цена ранга `rank` таланта на его месте (класс, «Основа» или ветка, ярус). */
  talentRank(place: TalentPlace, rank: number): Souls;
  /** Сколько стоит прокачать талант с нуля до `rank` включительно. */
  talentTotal(place: TalentPlace, rank: number): Souls;
  /** Цена уровня `level` перка (1 — сам перк); стартовый перк класса с ярусами бесплатен. */
  perk(perk: PerkDef, level: number): Souls;
  /** Сколько стоит перк с нуля до уровня `level` включительно. */
  perkTotal(perk: PerkDef, level: number): Souls;
  /** Цена метаморфозы в класс. */
  metamorphosis(classId: ClassId): Souls;
  /** Сколько возвращает отказ от класса, в ветку которого вложено `spent`. */
  refund(spent: number): Souls;
}
