import type { AbilityId } from '../../../perks/interfaces/AbilityId';
import type { AbilityParams } from '../../../perks/interfaces/AbilityParams';
import type { GoldCost } from '../../../perks/interfaces/GoldCost';
import type { PerkTarget } from '../../../perks/interfaces/PerkTarget';
import type { VfxStyle } from '../../../perks/interfaces/VfxStyle';

/**
 * Описание перка в конкретной фабрике: id и иконку фабрика выводит сама из класса и слота.
 * Числа способности (`params`) обязательны, если они у неё есть, и проверяются по её id.
 */
export type PerkSpecOf<A extends AbilityId> = {
  ability: A;
  ru: string;
  en: string;
  dru: string;
  den: string;
  vfx: VfxStyle;
  cost?: number;
  goldCost?: GoldCost;
  target?: PerkTarget;
  passive?: boolean;
  basic?: boolean;
  once?: boolean;
  cooldown?: number;
} & (keyof AbilityParams[A] extends never
  ? { params?: AbilityParams[A] }
  : { params: AbilityParams[A] });
