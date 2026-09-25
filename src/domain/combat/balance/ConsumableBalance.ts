import { Ratio, Turns } from '../../shared';

/** Действие расходников в бою. */
export const ConsumableBalance = {
  /** Зелье исцеления лечит долю максимального здоровья — так оно остаётся нужным и на десятом этаже. */
  healPotionPct: Ratio.of(0.35),
  /** Зелье восстановления наполняет ресурс класса и на столько ходов ускоряет его восстановление… */
  regenBoostTurns: Turns.of(5),
  /** …во столько раз. */
  regenBoostMul: 2,
} as const;
