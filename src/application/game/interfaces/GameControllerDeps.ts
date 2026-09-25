import type { Profile } from '../../../domain/account/profile';
import type { IRunSession } from '../../../domain/combat/room-battle';
import type { AdService } from '../../ads/AdService';
import type { IClock } from '../../ports/IClock';
import type { IPlatform } from '../../ports/IPlatform';
import type { AutoUseToggles } from '../AutoUseToggles';
import type { TowerRun } from '../TowerRun';
import type { IAnimationPlayer } from './IAnimationPlayer';
import type { IGameDialogs } from './IGameDialogs';
import type { IGameNavigator } from './IGameNavigator';
import type { IGameRenderer } from './IGameRenderer';
import type { IInput } from './IInput';

/** Всё, из чего собирается контроллер боя: бой, учёт забега и то, чем он говорит с игроком. */
export interface GameControllerDeps {
  run: IRunSession;
  tower: TowerRun;
  profile: Profile;
  autoUse: AutoUseToggles;
  ads: AdService;
  platform: IPlatform;
  view: IGameRenderer;
  player: IAnimationPlayer;
  dialogs: IGameDialogs;
  navigator: IGameNavigator;
  clock: IClock;
  input: IInput;
}
