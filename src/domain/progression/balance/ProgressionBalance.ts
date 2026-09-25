import { Gold, Ratio } from '../../shared';

/** Числа прогресса героя, которые не принадлежат одному классу или таланту. */
export const ProgressionBalance = {
  /** Цена нового героя (линейки) в золоте: первый герой открывается бесплатно при выборе. */
  heroUnlockCost: Gold.of(600),
  /** Отказ от финального класса возвращает эту долю вложенного в его ветку опыта душ. */
  cancelMetamorphosisRefund: Ratio.of(0.5),
} as const;
