import type { ILocale } from '../../application/ports';
import type { Lang } from '../../domain/types';
import { setLang } from '../../i18n';

/** Язык интерфейса — словарь `i18n` (и язык страницы). */
export class I18nLocale implements ILocale {
  apply(lang: Lang): void {
    setLang(lang);
  }
}
