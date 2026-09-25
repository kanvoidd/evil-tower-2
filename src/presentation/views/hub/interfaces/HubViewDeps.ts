import type { HubCommand } from '../../../../application/hub/interfaces/HubCommand';
import type { HubOrigin } from '../../../../application/hub/interfaces/HubOrigin';
import type { HubState } from '../../../../application/hub/interfaces/HubState';
import type { IHeroCardSource, IMuteSwitch, IWalletSource } from '../../../components';

export interface HubViewDeps {
  /** Что показать сейчас; подарки перечитываются раз в секунду. */
  state: () => HubState;
  /** Нажатия игрока. */
  commands: (cmd: HubCommand) => void;
  hero: IHeroCardSource;
  wallet: IWalletSource;
  audio: IMuteSwitch;
  /** Откуда пришли: из меню хаб «сжимает» окно в его кнопку. */
  from?: HubOrigin;
}
