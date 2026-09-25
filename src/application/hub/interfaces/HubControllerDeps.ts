import type { Profile } from '../../../domain/logic/profile';
import type { IClock } from '../../ports';
import type { ClaimDailyReward } from '../../rewards/ClaimDailyReward';
import type { ClaimTowerGift } from '../../rewards/ClaimTowerGift';
import type { GetHubState } from '../GetHubState';
import type { IHubDialogs } from './IHubDialogs';
import type { IHubNavigator } from './IHubNavigator';
import type { IHubView } from './IHubView';

export interface HubControllerDeps {
  profile: Profile;
  state: GetHubState;
  daily: ClaimDailyReward;
  gift: ClaimTowerGift;
  view: IHubView;
  dialogs: IHubDialogs;
  navigator: IHubNavigator;
  clock: IClock;
}
