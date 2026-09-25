import type { PerkSlot } from '../../../catalog';

/** Таблица цен в душах по ступеням классов (её значения — `SoulPriceBalance`). */
export interface SoulPriceTable {
  /** Базовая цена ранга таланта: строка — ступень класса, столбец — ярус (с нуля). */
  readonly talentBase: readonly (readonly number[])[];
  /** На какую долю базы каждый следующий ранг дороже предыдущего. */
  readonly rankStep: number;
  /** Во сколько раз способность дороже базовой цены яруса того же уровня. */
  readonly perkMul: Readonly<Record<PerkSlot, number>>;
  /** Метаморфоза во вторую ступень и в финальный класс. */
  readonly metamorphosis: { readonly second: number; readonly final: number };
}
