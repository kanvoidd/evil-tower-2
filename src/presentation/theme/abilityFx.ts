import type { AbilityId } from '../../domain/catalog';
import type { FxStyle } from '../../domain/combat';

/**
 * Вспышка способности по умолчанию — её визуальный почерк: рисуется, если механика ничего не
 * нарисовала сама (усиления, лечение, щиты), и задаёт рисунок и цвет значка способности.
 * У каждой способности игры есть строка (проверяет selftest).
 */
export const ABILITY_FX: Readonly<Record<AbilityId, FxStyle>> = {
  // warrior
  power_strike: 'slam',
  earthquake: 'quake',
  never_give_up: 'quake',
  shield_bash: 'slam',
  war_cry: 'banner',
  duel: 'swap',
  whirlwind: 'blades',
  rage: 'slam',
  carnage: 'blades',
  madness: 'blades',
  holy_wrath: 'holy',
  justice_beam: 'beam',
  verdict: 'holy',
  heavens_wrath: 'holy',
  // mage
  lightning: 'bolt',
  magic_shot: 'arcane',
  chain_lightning: 'chain',
  swap: 'swap',
  deck_draw: 'arcane',
  rewind: 'rewind',
  corpse_blast: 'corpse',
  ghosts: 'ghost',
  voodoo: 'voodoo',
  dead_harvest: 'harvest',
  ignite: 'ignite',
  fireball: 'fireball',
  detonate: 'detonate',
  inferno: 'inferno',
  // archer
  pierce_shot: 'shot',
  diagonal: 'shot',
  ricochet: 'shot',
  falcon_hunt: 'arrows',
  falcon_courier: 'arrows',
  eagle_eye: 'arrows',
  double_shot: 'shot',
  hunter_thrill: 'shot',
  arrow_rain: 'arrows',
  starfall: 'arrows',
  rail_shot: 'shot',
  armor_piercing: 'shot',
  hunters_mark: 'mark',
  one_shot: 'beam',
  // mercenary
  backstab: 'smoke',
  bribe: 'smoke',
  cold_blood: 'smoke',
  shadow_dance: 'smoke',
  sentence: 'mark',
  lethal_dose: 'dark',
  death_mark: 'mark',
  chain_mark: 'mark',
  shadow_reap: 'dark',
  reaper: 'dark',
  shuriken_fan: 'blades',
  substitution: 'smoke',
  smoke_screen: 'smoke',
  wind_shadow: 'blades',
};
