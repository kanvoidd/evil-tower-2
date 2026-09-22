export const GAME_W = 720;
export const GAME_H = 1280;

/**
 * Заголовки и логотип — Alegreya SC (капитель с каллиграфическим характером, книжно-фэнтезийная),
 * всё остальное (подписи, числа) — Nunito. Оба шрифта под лицензией SIL OFL 1.1 (свободно, в том числе в коммерческих играх).
 */
export const FONT_TITLE = '"Alegreya SC", Georgia, serif';
export const FONT_UI = 'Nunito, "Segoe UI", system-ui, sans-serif';
export const FONT_NUM = FONT_UI;

/** Поля экрана и базовый шаг сетки. */
export const SAFE = { x: 32, top: 28, bottom: 32 } as const;

export const COLOR = {
  bg: 0x0c0e14,
  panel: 0x191c28,
  panelHi: 0x232838,
  line: 0x343b55,
  gold: 0xf0c75e,
  goldDeep: 0xb9862c,
  soul: 0xa98bff,
  hp: 0x3fdb84,
  green: 0x59d38b,
  blue: 0x5aa9ff,
  red: 0xe5564d,
  text: 0xf4eddc,
  textDim: 0xa3a9bd,
  glow: 0xffd98a,
} as const;

export const HEX = {
  text: '#f4eddc',
  textDim: '#a3a9bd',
  textMute: '#717892',
  gold: '#f3cf72',
  soul: '#b79dff',
  hp: '#5fe89c',
  dark: '#0b0d12',
  black: '#000000',
  good: '#66e39c',
  bad: '#ff7468',
  white: '#ffffff',
} as const;

/** Тайминги. Пульсация намеренно медленная и едва заметная. */
export const TIMING = {
  uiPulseCycle: 3600,
  playPulseCycle: 2800,
  uiPulseScale: 1.015,
  playPulseScale: 1.035,
  attackLunge: 350,
  blinkTotal: 750,
  blinkInterval: 250,
  cardSpawn: 260,
  cardMove: 220,
  menuZoom: 420,
} as const;

export const CAROUSEL = {
  activeScale: 1,
  inactiveScale: 0.34,
  pulseCycle: 3200,
  pulseScale: 1.03,
} as const;

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

export const ADS = {
  /** Минимум комнат до первой полноэкранной рекламы (защита новичков). */
  firstAdAfterRooms: 3,
  /** Минимальный интервал между собственными показами полноэкранной рекламы. */
  interstitialCooldownMs: 3 * 60 * 1000,
  giftCooldownMs: 6 * 60 * 1000,
} as const;
