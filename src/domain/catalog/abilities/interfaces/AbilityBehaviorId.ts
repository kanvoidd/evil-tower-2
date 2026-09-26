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
  // маг и лучник: общие механики
  | 'strike'
  | 'ward'
  // маг
  | 'chain_lightning'
  | 'ray'
  | 'detonate'
  | 'swap'
  | 'shuffle'
  | 'dead_servant'
  // лучник
  | 'pierce_shot'
  | 'bolt_volley'
  | 'still_aim'
  | 'hook'
  | 'stampede'
  | 'trap'
  | 'armed_trap'
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
