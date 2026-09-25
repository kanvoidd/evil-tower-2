/**
 * Механики способностей — то, что умеет бой. За каждым id стоит правило боя: у кнопки — класс
 * в `combat/abilities/<линейка>/<механика>/` (реестр `ABILITY_BEHAVIORS`), у пассивки и базового
 * действия — правило в частях боя. Вид чисел каждой механики — `AbilityBehaviorParams`.
 *
 * Способность (`AbilityDef`) называет механику, которая её исполняет, поэтому новая способность
 * на готовой механике — только определение, без кода боя.
 */
export type AbilityBehaviorId =
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
