import type { RunEndReason } from './RunEndReason';

/** Итог забега: сколько комнат, рекорд ли это, вся добыча и что пропало. */
export interface RunSummary {
  reason: RunEndReason;
  rooms: number;
  maxRooms: number;
  record: boolean;
  /** Рекорд героя после этого забега. */
  best: number;
  gold: number;
  souls: number;
  /** Добыча недопройденной комнаты пропала (гибель или побег). */
  lootLost: boolean;
  /** Можно удвоить награду за просмотр видео. */
  canDouble: boolean;
}
