/**
 * Реестр перков. Перк — это способность класса: либо кнопка на поле боя (⚡ цена в ресурсе),
 * либо базовое действие линейки (выстрел через карту, удар в спину, удар молнии — применяется
 * нажатием по карте), либо пассивный триггер (🔁 работает сам).
 *
 * Чтобы «прикрутить» иконку — положите файл perk_<id>.png в src/assets/images.
 * Логика способности — `ability`, см. `applyAbility` в src/domain/logic/run/Run.ts.
 */
export type AbilityId =
  // воин
  | 'power_strike'
  | 'earthquake'
  | 'never_give_up'
  | 'shield_bash'
  | 'war_cry'
  | 'duel'
  | 'whirlwind'
  | 'rage'
  | 'carnage'
  | 'madness'
  | 'holy_wrath'
  | 'justice_beam'
  | 'verdict'
  | 'heavens_wrath'
  // маг
  | 'lightning'
  | 'magic_shot'
  | 'chain_lightning'
  | 'swap'
  | 'deck_draw'
  | 'rewind'
  | 'corpse_blast'
  | 'ghosts'
  | 'voodoo'
  | 'dead_harvest'
  | 'ignite'
  | 'fireball'
  | 'detonate'
  | 'inferno'
  // лучник
  | 'pierce_shot'
  | 'diagonal'
  | 'ricochet'
  | 'falcon_hunt'
  | 'falcon_courier'
  | 'eagle_eye'
  | 'double_shot'
  | 'hunter_thrill'
  | 'arrow_rain'
  | 'starfall'
  | 'rail_shot'
  | 'armor_piercing'
  | 'hunters_mark'
  | 'one_shot'
  // наёмник
  | 'backstab'
  | 'bribe'
  | 'cold_blood'
  | 'shadow_dance'
  | 'sentence'
  | 'lethal_dose'
  | 'death_mark'
  | 'chain_mark'
  | 'shadow_reap'
  | 'reaper'
  | 'shuriken_fan'
  | 'substitution'
  | 'smoke_screen'
  | 'wind_shadow';
