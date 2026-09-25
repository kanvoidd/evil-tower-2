import type { AbilityId, ClassId, LineageId, PerkDef, ResourceKind } from '../../../catalog';
import type { Percent, Ratio } from '../../../shared';
import type { IAttackStrategy } from '../../attack/interfaces/IAttackStrategy';

/**
 * Герой глазами боя: характеристики, способности и стиль атаки. Собирает их прогресс героя
 * (`buildPlayerStats`: база линейки, класс, таланты, снаряжение), бой только читает и не знает,
 * откуда взялось число.
 *
 * Единицы видны по типу: шанс — в процентах (`Percent`, 25 — это 25 %), прибавки, снижения и доли
 * здоровья — в долях (`Ratio`, 0,25), остальное — очки характеристик, ресурса и множители.
 */
export interface PlayerStats {
  classId: ClassId;
  lineage: LineageId;
  resource: ResourceKind;
  maxHp: number;
  damage: number;
  crit: Percent;
  dodge: Percent;
  parry: Percent;
  defense: number;
  luck: number;
  resMax: number;
  regen: number;
  /** Стиль боя линейки: бьёт ли герой рукой и чем достаёт дальнего врага. */
  attack: IAttackStrategy;
  /** Цена базового действия линейки в ресурсе. */
  rangedCost: number;
  /** Границы случайного множителя крита. */
  critMin: number;
  critMax: number;
  goldBonus: Ratio;
  soulBonus: Ratio;
  artifactMul: Ratio;
  /** Множитель силы способностей: 1 — базовая, 2 — вдвое сильнее. */
  perkPower: number;

  // ---- таланты пути урона
  execute: Ratio;
  pierce: Ratio;
  doubleStrike: Percent;
  lowHpDmg: Ratio;
  fullHpDmg: Ratio;
  bossDmg: Ratio;
  ignite: Ratio;
  killDmg: Ratio;
  rageDmg: Ratio;
  goldDmg: Ratio;
  defDmg: Ratio;
  everyThird: boolean;
  roomCrit: boolean;
  lifesteal: Ratio;

  // ---- синергии: меняют уже полученные способности
  abilityIgnite: Percent;
  abilityStun: Percent;
  abilitySplash: Ratio;
  abilityPoison: Ratio;
  abilityVuln: Ratio;
  abilityCrit: Percent;
  abilityLifesteal: Ratio;
  abilityRefund: Ratio;
  abilityShield: Ratio;
  killBlast: Ratio;
  /** «Раздвоение молнии»: шанс задеть второго врага и доля урона по нему. */
  splitChance: Ratio;
  splitDmg: Ratio;
  perkCostDown: number;
  /** «Раздвоение молнии»: шанс второго разряда по той же цели и его доля урона. */
  echoChance: Ratio;
  echoDmg: Ratio;
  /** Усиление отдельных заклинаний мага. */
  lightningPower: Ratio;
  shotPower: Ratio;
  chainPower: Ratio;

  // ---- таланты пути здоровья
  lowHpDr: Ratio;
  bigHitCut: Ratio;
  startShieldPct: Ratio;
  potionPct: Ratio;
  cheatDeath: number;
  reviveHp: Ratio;
  killHp: Ratio;
  bossHp: Ratio;
  freePerk: boolean;
  healShield: Ratio;
  stepHeal: Ratio;

  // ---- таланты пути защиты
  block: Percent;
  thorns: Ratio;
  weaken: Ratio;
  firstHitDown: Ratio;
  dotDr: Ratio;
  bossDr: Ratio;
  magicDr: Ratio;
  killDefTurn: Ratio;
  killDefStack: Ratio;
  roomGuard: Ratio;
  counterBuff: Ratio;
  highHpDef: Ratio;
  resDef: Ratio;
  perkDef: Ratio;
  scarDef: Ratio;
  manaShield: Ratio;

  perks: string[];
  /** Способности с кнопкой на поле боя (в порядке слотов). */
  abilities: PerkDef[];
  /** Пассивные способности класса. */
  passives: Set<AbilityId>;
}
