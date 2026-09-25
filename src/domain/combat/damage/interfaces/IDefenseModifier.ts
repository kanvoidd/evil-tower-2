import type { HeroView } from './HeroView';

/** Надбавка к защите героя: множит защиту и округляет (надбавки идут по порядку). */
export interface IDefenseModifier {
  apply(defense: number, hero: HeroView): number;
}
