import type { Ratio, Turns } from '../../../shared';
import type { NoParams } from './NoParams';

/**
 * Числа способностей — по id способности. Числа живут в определении способности (фабрика героя),
 * бой их только читает, а тексты подставляют в описания.
 *
 * Единицы видны по типу: урон способности — доля урона героя (`Ratio`: 0,6 — 60 %, 2 — 200 %),
 * длительности — ходы (`Turns`), доли здоровья, ослабления и шансы — `Ratio`, штуки — целые числа.
 * `cap` — предел, выше которого не поднимает даже талант «сила способностей».
 */
export interface AbilityParams {
  // ---- воин
  power_strike: { dmg: Ratio };
  earthquake: { dmg: Ratio; stun: Turns };
  /** Ударная волна: все враги получают во столько раз больше принятого урона. */
  never_give_up: { shockMul: number };
  /** У края поля удар о стену сильнее во `wallMul` раз. */
  shield_bash: { dmg: Ratio; wallMul: number; stun: Turns };
  /** Ослабление атаки врагов до конца комнаты; повторный клич складывается до `cap`. */
  war_cry: { weaken: Ratio; cap: Ratio };
  duel: { stun: Turns };
  whirlwind: { dmg: Ratio };
  /** Каждые `hpPerResource` потерянного здоровья дают единицу выносливости. */
  rage: { hpPerResource: number };
  /** Каждое убийство подряд прибавляет `perKill` к урону, не больше `cap`. */
  carnage: { perKill: Ratio; cap: Ratio };
  /** Удар задевает соседей цели на `splash` урона; в конце герой теряет `hpCost` текущего здоровья. */
  madness: { turns: Turns; splash: Ratio; hpCost: Ratio };
  /** `holyDmg` — по нежити и демонам. */
  holy_wrath: { dmg: Ratio; holyDmg: Ratio };
  justice_beam: { dmg: Ratio; holyDmg: Ratio };
  /** Гибнут враги, у которых здоровья не больше `limit` урона героя. */
  verdict: { limit: Ratio };
  heavens_wrath: { dmg: Ratio; holyDmg: Ratio; stun: Turns };

  // ---- маг
  lightning: { dmg: Ratio };
  magic_shot: { dmg: Ratio };
  /** Урон по цели и следующим врагам цепи; сколько множителей — столько целей. */
  chain_lightning: { falloff: readonly Ratio[] };
  swap: NoParams;
  deck_draw: NoParams;
  rewind: NoParams;
  /** Труп взрывается на `blast` своего максимального здоровья. */
  corpse_blast: { blast: Ratio };
  /** Призрак живёт `turns` ходов и бьёт на `dmg`; призраков на поле не больше `maxGhosts`. */
  ghosts: { turns: Turns; dmg: Ratio; maxGhosts: number };
  /** Доля урона по связанному врагу, которая расходится по остальным. */
  voodoo: { share: Ratio };
  /** Враги теряют долю текущего здоровья (боссы — `bossHpShare`); души с убитых — плюс `soulBonus`. */
  dead_harvest: { hpShare: Ratio; bossHpShare: Ratio; cap: Ratio; soulBonus: Ratio };
  /** Горение: `burn` урона героя за ход, `turns` ходов. */
  ignite: { burn: Ratio; turns: Turns };
  fireball: { dmg: Ratio; splash: Ratio; burn: Ratio; turns: Turns };
  /** Взрыв горящего врага: себе `blastMul`, соседям `splashMul` его урона горения. */
  detonate: { blastMul: Ratio; splashMul: Ratio };
  inferno: { burn: Ratio; turns: Turns };

  // ---- лучник
  pierce_shot: NoParams;
  diagonal: NoParams;
  ricochet: { falloff: readonly Ratio[] };
  falcon_hunt: { dmg: Ratio; stun: Turns };
  falcon_courier: NoParams;
  eagle_eye: NoParams;
  double_shot: { dmg: Ratio };
  hunter_thrill: NoParams;
  arrow_rain: { arrows: number; dmg: Ratio };
  starfall: { waves: number; dmg: Ratio };
  /** Каждый следующий враг на линии получает урон, умноженный ещё раз на `stepMul`. */
  rail_shot: { stepMul: Ratio };
  /** Бонус к выстрелу — доля максимального здоровья цели. */
  armor_piercing: { dmg: Ratio; hpShare: Ratio; cap: Ratio };
  hunters_mark: NoParams;
  /** Убивает до `kills` не-боссов на линии; босс теряет `bossHpShare` максимального здоровья. */
  one_shot: { kills: number; bossHpShare: Ratio; cap: Ratio };

  // ---- наёмник
  backstab: NoParams;
  bribe: NoParams;
  /** Удар в спину, убивший врага, возвращает столько ресурса. */
  cold_blood: { resource: number };
  /** Сколько ещё ударов в спину после первого может дать цепь. */
  shadow_dance: { extraStrikes: number };
  /** Цель получает больше урона на `vuln`, повторно — не выше `cap`. */
  sentence: { vuln: Ratio; cap: Ratio };
  /** Яд: доля максимального здоровья за ход (у боссов — `bossPoison`), `turns` ходов. */
  lethal_dose: { poison: Ratio; bossPoison: Ratio; turns: Turns };
  /** Через `turns` ходов враг умирает, босс теряет `bossHpShare` максимального здоровья. */
  death_mark: { turns: Turns; bossHpShare: Ratio };
  /** Перескочившее клеймо снова отсчитывает `turns` ходов. */
  chain_mark: { turns: Turns };
  shadow_reap: { bossHpShare: Ratio };
  reaper: { turns: Turns };
  shuriken_fan: { targets: number; dmg: Ratio };
  substitution: NoParams;
  smoke_screen: { turns: Turns };
  wind_shadow: { dmg: Ratio };
}
