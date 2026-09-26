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
  ignite: 'ignite',
  detonate: 'detonate',
  frost_spike: 'chain',
  ice_armor: 'holy',
  lightning: 'bolt',
  chain_lightning: 'chain',
  magic_shot: 'arcane',
  swap: 'swap',
  shuffle: 'rewind',
  blight_shot: 'corpse',
  dead_servant: 'ghost',
  magic_shield: 'soul',
  // hunter
  pierce_shot: 'shot',
  still_aim: 'mark',
  bolt_volley: 'shot',
  hook_bolt: 'slam',
  stampede: 'quake',
  falcon: 'arrows',
  snare: 'blades',
  armed_trap: 'banner',
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
