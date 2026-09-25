import { Ratio } from '../../shared';

/** Числа экономики, которые не принадлежат одной вещи или расходнику. */
export const EconomyBalance = {
  /** Полная починка стоит эту долю цены вещи (частичная — пропорционально износу). */
  repairShare: Ratio.of(0.35),
} as const;
