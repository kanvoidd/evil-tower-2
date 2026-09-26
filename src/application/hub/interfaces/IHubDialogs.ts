import type { DailyStatus } from '../../../domain/account';
import type { GiftReward } from '../../../domain/rewards';
import type { RewardChoice } from '../../rewards/interfaces/RewardChoice';

/** Окна хаба. Каждое ждёт выбора игрока: забрать награду как есть или удвоить за видео. */
export interface IHubDialogs {
  daily(status: DailyStatus): Promise<RewardChoice>;
  /** «Дар башни»: окно показывает, сколько даст подарок. */
  gift(reward: GiftReward): Promise<RewardChoice>;
}
