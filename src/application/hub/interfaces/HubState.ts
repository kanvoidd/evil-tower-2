import type { DailyStatus } from '../../../domain/account/profile';
import type { GiftState } from './GiftState';
import type { HubHint } from './HubHint';
import type { HubRecord } from './HubRecord';

/** Что показывает хаб. */
export interface HubState {
  record: HubRecord;
  /** В дереве навыков есть что купить на текущие души. */
  skillBadge: boolean;
  /** В лавке по карману следующая ступень оружия или брони. */
  shopBadge: boolean;
  gift: GiftState;
  daily: DailyStatus;
  hint: HubHint | null;
}
