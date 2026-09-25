import type { Profile } from '../../domain/logic/profile';
import type { Lang } from '../../domain/types';
import type { ILocale } from '../ports';

/** Язык игры: выбор игрока сохраняется в профиле и сразу переключает интерфейс. */
export class LanguageSettings {
  constructor(private readonly profile: Profile, private readonly locale: ILocale) {}

  get lang(): Lang {
    return this.profile.lang;
  }

  /** Сменить язык. false — этот язык уже выбран. */
  change(lang: Lang): boolean {
    if (this.profile.lang === lang) return false;
    this.profile.setLang(lang);
    this.locale.apply(lang);
    return true;
  }
}
