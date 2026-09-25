import type { HubMenu } from './HubMenu';

/** Что игрок сделал в хабе. */
export type HubCommand =
  /** «Играть» — новый забег с комнаты 1-1. */
  | { type: 'play' }
  | { type: 'open'; menu: HubMenu }
  /** Ежедневная награда. */
  | { type: 'daily' }
  /** «Дар башни». */
  | { type: 'gift' };
