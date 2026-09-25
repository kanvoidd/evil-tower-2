import type { Lang } from '../../../domain/shared';

/** Что игрок сделал в настройках. */
export type SettingsCommand =
  /** Громкость 0…1 (ползунок). */
  { type: 'volume'; value: number } | { type: 'language'; lang: Lang } | { type: 'close' };
