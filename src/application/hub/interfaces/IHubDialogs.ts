import type { DailyStatus } from '../../../domain/account';
import type { RewardChoice } from '../../rewards/interfaces/RewardChoice';

/** Окна хаба. Каждое ждёт выбора игрока: забрать награду как есть или удвоить за видео. */
export interface IHubDialogs {
  daily(status: DailyStatus): Promise<RewardChoice>;
  gift(): Promise<RewardChoice>;
}
