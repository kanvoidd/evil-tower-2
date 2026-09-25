import type { DamageAcc } from './DamageAcc';
import type { HeroView } from './HeroView';

/**
 * Надбавка к урону героя от таланта или пассивки: прибавляет к множителю (`acc.mul += …`)
 * или к базе (`acc.base += …`). Конвейер применяет надбавки по порядку и округляет один раз.
 */
export interface IHeroDamageModifier {
  apply(acc: DamageAcc, hero: HeroView): void;
}
