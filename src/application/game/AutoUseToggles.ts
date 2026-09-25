import type { Profile } from '../../domain/account/profile';
import type { AutoUseSave, ConsumableId } from '../../domain/types';

/** Переключатели «АВТО» под расходниками: у каждого расходника свой флаг в профиле. */
export class AutoUseToggles {
  private static readonly KEY: Record<ConsumableId, keyof AutoUseSave> = {
    potion_heal: 'heal',
    potion_regen: 'regen',
    artifact: 'artifact',
  };

  constructor(private readonly profile: Profile) {}

  get config(): AutoUseSave {
    return this.profile.autoUse;
  }

  isOn(item: ConsumableId): boolean {
    return this.profile.autoUse[AutoUseToggles.KEY[item]];
  }

  /** Переключить; возвращает новое состояние. */
  toggle(item: ConsumableId): boolean {
    const key = AutoUseToggles.KEY[item];
    const on = !this.profile.autoUse[key];
    const patch: Partial<AutoUseSave> = {};
    patch[key] = on;
    this.profile.setAutoUse(patch);
    return on;
  }
}
