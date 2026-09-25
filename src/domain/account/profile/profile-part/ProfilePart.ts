import type { AccountState } from '../account-state/AccountState';
import type { ProfileParts } from '../interfaces/ProfileParts';

/**
 * Часть профиля. Все части работают над одним документом сохранения (`this.state.doc`) и зовут
 * друг друга по имени (`this.parts.wallets.addGold`).
 */
export abstract class ProfilePart {
  constructor(
    protected readonly state: AccountState,
    protected readonly parts: ProfileParts,
  ) {}

  protected get doc(): AccountState['doc'] {
    return this.state.doc;
  }
}
