import type { Gold, Souls } from '../../../shared';

/** Где лежат деньги героя (в сохранении — `HeroSave`). */
export interface Purse {
  gold: Gold;
  souls: Souls;
}
