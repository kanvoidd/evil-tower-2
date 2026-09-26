import type { Ratio, Turns } from '../../../shared';
import type { NoParams } from './NoParams';

/**
 * Вид чисел каждой механики способности. Сами числа живут в определении способности
 * (`heroes/<линейка>/abilities/<класс>.ts`), бой их только читает, а тексты подставляют в описания.
 *
 * Единицы видны по типу: урон способности — доля урона героя (`Ratio`: 0,6 — 60 %, 2 — 200 %),
 * длительности — ходы (`Turns`), доли здоровья, ослабления и шансы — `Ratio`, штуки — целые числа.
 * `cap` — предел, выше которого не поднимает даже талант «сила способностей».
 */
export interface AbilityBehaviorParams {
  // ---- воин
  power_strike: { dmg: Ratio };
  earthquake: { dmg: Ratio; stun: Turns };
  /** Смертельный удар оставляет `hpLeft` здоровья; ударная волна бьёт в `shockMul` раз сильнее принятого удара. */
  never_give_up: { hpLeft: number; shockMul: number };
  /** У края поля удар о стену сильнее во `wallMul` раз. */
  shield_bash: { dmg: Ratio; wallMul: number; stun: Turns };
  /** Ослабление атаки врагов до конца комнаты; повторный клич складывается до `cap`. */
  war_cry: { weaken: Ratio; cap: Ratio };
  duel: { stun: Turns };
  whirlwind: { dmg: Ratio };
  /** Каждые `hpPerResource` потерянного здоровья дают `resource` выносливости. */
  rage: { hpPerResource: number; resource: number };
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

  // ---- маг и лучник: общие механики
  /**
   * Удар по цели с эффектами. `dmg` — урон (0 — без урона, только эффекты). Остальное — по желанию:
   * - `manaAbove`/`manaBonus` — прибавка к урону, если ресурса в момент применения не меньше доли шкалы;
   * - `weaken` — враг бьёт слабее на эту долю, `armorBreak` — его броня меньше на эту долю,
   *   оба держатся `debuffTurns` ходов;
   * - `burn` за тик, `ticks` — тиков горения; повторное применение добавляет тики к горящим.
   *   `burstAt` — сколько тиков нужно для взрыва: цель получает `burstMul` накопленного горения,
   *   соседи — `burstSplash`;
   * - `freeze` — шанс заморозить цель на `freezeTurns` ходов;
   * - `bleed` за ход, `bleedTurns` ходов;
   * - `infect` — заражение: умирая, цель взрывается на эту долю своего максимального здоровья,
   *   а соседей заражает с шансом `spread`.
   */
  strike: {
    dmg: Ratio;
    manaAbove?: Ratio;
    manaBonus?: Ratio;
    weaken?: Ratio;
    armorBreak?: Ratio;
    debuffTurns?: Turns;
    burn?: Ratio;
    ticks?: Turns;
    burstAt?: number;
    burstMul?: Ratio;
    burstSplash?: Ratio;
    freeze?: Ratio;
    freezeTurns?: Turns;
    bleed?: Ratio;
    bleedTurns?: Turns;
    infect?: Ratio;
    spread?: Ratio;
  };
  /**
   * Защита на себя: щит на долю максимального здоровья. `defense` — прибавка к защите, `thorns` —
   * ответный удар каждому атакующему врагу (доля урона героя), оба держатся `turns` ходов.
   */
  ward: { shield: Ratio; defense?: number; thorns?: Ratio; turns?: Turns };

  // ---- маг
  /** Урон по цели и следующим врагам цепи; сколько множителей — столько целей. */
  chain_lightning: { falloff: readonly Ratio[] };
  /**
   * Выстрел по линии от героя: бьёт `pierce` первых врагов, каждый следующий слабее на `stepLoss`.
   * Заряд: каждый ход, пока выстрел готов и не применён, он сильнее на `chargePer`, не больше
   * `chargeMax` зарядов.
   */
  ray: { dmg: Ratio; pierce: number; stepLoss: Ratio; chargePer?: Ratio; chargeMax?: number };
  /** Взрыв горящих врагов: себе `blastMul`, соседям `splashMul` накопленного горения. */
  detonate: { blastMul: Ratio; splashMul: Ratio };
  swap: NoParams;
  shuffle: NoParams;
  /** Слуга на месте заражённого: доля здоровья и удара врага, живёт `turns` ходов. */
  dead_servant: { hp: Ratio; dmg: Ratio; turns: Turns };

  // ---- лучник
  /** Выстрел через карту; `diagSplash` — враги по диагонали от цели получают эту долю урона. */
  pierce_shot: { diagSplash?: Ratio };
  /**
   * Выстрел через карту, а удар вплотную пробивает броню. `pierce` — сколько врагов на линии
   * выстрела получает урон, каждый следующий слабее на `stepLoss`.
   */
  bolt_volley: { pierce?: number; stepLoss?: Ratio };
  /** Каждый ход на месте прибавляет `perStack` к урону, не больше `maxStacks` раз. */
  still_aim: { perStack: Ratio; maxStacks: number };
  /**
   * Притягивает врага на соседнюю клетку. `pullDmg`/`pullStun` — удар и оглушение притянутого,
   * `chainPull` (1) — вся линия цели сдвигается на шаг к герою.
   */
  hook: { pullDmg?: Ratio; pullStun?: Turns; chainPull?: number };
  /**
   * Кабаны пробегают линию: бьют врагов на `dmg` урона героя и оглушают на `stun` ходов, кучки
   * золота сминаются до монеты.
   * `anyLine` (1) — любая линия, иначе только строка или столбец героя; `cross` (1) — крестом.
   */
  stampede: { dmg: Ratio; stun: Turns; anyLine?: number; cross?: number };
  /** Ловушка на клетку: враг, попавший на неё, получает `dmg` урона героя и оглушение. */
  trap: { dmg: Ratio; stun: Turns };
  /** Отложенная способность на клетку: задержка до `maxDelay` ходов, `charges` штук за комнату. */
  armed_trap: { maxDelay: Turns; charges: number };

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
