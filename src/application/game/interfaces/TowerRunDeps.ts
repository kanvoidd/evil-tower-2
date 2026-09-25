import type { Profile } from '../../../domain/account';
import type { IPlatform } from '../../ports/IPlatform';
import type { IProfileStorage } from '../../ports/IProfileStorage';
import type { ISeedSource } from '../../ports/ISeedSource';

/** С чем работает учёт забега: профиль, платформа, запись сохранения, зёрна комнат. */
export interface TowerRunDeps {
  profile: Profile;
  platform: IPlatform;
  storage: IProfileStorage;
  seeds: ISeedSource;
}
