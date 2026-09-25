import { Gold, Souls } from '../../../shared';
import type { HeroSave } from '../interfaces/HeroSave';

/** Новый герой начинает с нулями: ни золота, ни душ, ни расходников, ни доспеха. */
export const emptyHeroSave = (): HeroSave => ({
  gold: Gold.of(0),
  souls: Souls.of(0),
  consumables: { potion_heal: 0, potion_regen: 0, artifact: 0 },
  armor: null,
  best: 0,
});
