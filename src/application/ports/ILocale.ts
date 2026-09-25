import type { Lang } from '../../domain/types';

/** Язык интерфейса: словарь текстов и язык страницы. Реализация — в presentation. */
export interface ILocale {
  apply(lang: Lang): void;
}
