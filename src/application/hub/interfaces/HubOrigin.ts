import type { HubMenu } from './HubMenu';

/** Откуда игрок пришёл в хаб: из меню (окно сжимается в его кнопку) или из боя. Без значения — запуск игры. */
export type HubOrigin = HubMenu | 'game';
