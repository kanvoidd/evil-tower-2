/** Числа правил боя и прогресса: их читает логика, а не отрисовка. */
export const GAMEPLAY = {
  /** Крит бьёт каждый раз по-разному: множитель выпадает случайно между минимумом и максимумом. */
  critMulMin: 1.3,
  critMulMax: 1.9,
  /** Зелье лечит долю максимального здоровья — так оно остаётся нужным и на десятом этаже. */
  healPotionPct: 0.35,
  /** Зелье восстановления: мгновенно наполняет ресурс класса и ускоряет его восстановление. */
  regenBoostTurns: 5,
  regenBoostMul: 2,
  maxDefenseReduction: 0.5,
  weakAttackRatio: 0.4,
  cancelMetamorphosisRefund: 0.5,
  classUnlockCost: 600,
  reviveHpRatio: 0.6,
  /** Шанс, что сундук, помимо золота, даст расходник (и ещё один сверху). */
  chestItemChance: 0.35,
  chestBonusItemChance: 0.08,
} as const;
