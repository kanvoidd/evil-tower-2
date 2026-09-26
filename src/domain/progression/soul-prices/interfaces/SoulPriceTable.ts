import type { TieredPerkSlot } from '../../../catalog';

/** Таблица цен в душах по ступеням классов (её значения — `SoulPriceBalance`). */
export interface SoulPriceTable {
  /**
   * Базовая цена ранга таланта: строка — ступень цены, столбец — ярус (с нуля). Ступень цены у
   * класса с ярусами — его ступень; у подкласса — первая строка, у переходного — вторая; у
   * «Основы» ярусы 1–3 — первая строка, 4–6 — вторая.
   */
  readonly talentBase: readonly (readonly number[])[];
  /** На какую долю базы каждый следующий ранг дороже предыдущего. */
  readonly rankStep: number;
  /** Во сколько раз способность класса с ярусами дороже базовой цены яруса того же уровня. */
  readonly perkMul: Readonly<Record<TieredPerkSlot, number>>;
  /** Во сколько раз первый уровень перка в ветке дороже базовой цены его яруса. */
  readonly branchPerkMul: number;
  /** На какую долю цены первого уровня каждый следующий уровень перка дороже предыдущего. */
  readonly perkLevelStep: number;
  /** Метаморфоза: вторая ступень и финальный класс (ярусы), подкласс и переходный класс (ветки). */
  readonly metamorphosis: {
    readonly second: number;
    readonly final: number;
    readonly subclass: number;
    readonly transitional: number;
  };
}
