import type { AbilityId } from '../../../perks/interfaces/AbilityId';
import type { PerkTarget } from '../../../perks/interfaces/PerkTarget';
import type { VfxStyle } from '../../../perks/interfaces/VfxStyle';

/** Описание перка в конкретной фабрике: id и иконку фабрика выводит сама из класса и слота. */
export interface PerkSpec {
  ability: AbilityId;
  ru: string;
  en: string;
  dru: string;
  den: string;
  vfx: VfxStyle;
  cost?: number;
  goldCost?: number;
  target?: PerkTarget;
  passive?: boolean;
  basic?: boolean;
  once?: boolean;
  cooldown?: number;
}
