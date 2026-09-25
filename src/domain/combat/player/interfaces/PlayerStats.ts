import type { AbilityId, ClassId, LineageId, PerkDef, ResourceKind } from '../../../catalog';
import type { IAttackStrategy } from '../../attack/interfaces/IAttackStrategy';

/**
 * Герой глазами боя: характеристики, способности и стиль атаки. Собирает их прогресс героя
 * (`buildPlayerStats`: база линейки, класс, таланты, снаряжение), бой только читает и не знает,
 * откуда взялось число.
 */
export interface PlayerStats {
  classId: ClassId;
  lineage: LineageId;
  resource: ResourceKind;
  maxHp: number;
  damage: number;
  crit: number;
  dodge: number;
  parry: number;
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
  goldBonus: number;
  soulBonus: number;
  artifactMul: number;
  /** Множитель силы способностей: 1 — базовая, 2 — вдвое сильнее. */
  perkPower: number;

  // ---- таланты пути урона
  execute: number;
  pierce: number;
  doubleStrike: number;
  lowHpDmg: number;
  fullHpDmg: number;
  bossDmg: number;
  ignite: number;
  killDmg: number;
  rageDmg: number;
  goldDmg: number;
  defDmg: number;
  everyThird: boolean;
  roomCrit: boolean;
  lifesteal: number;

  // ---- синергии: меняют уже полученные способности
  abilityIgnite: number;
  abilityStun: number;
  abilitySplash: number;
  abilityPoison: number;
  abilityVuln: number;
  abilityCrit: number;
  abilityLifesteal: number;
  abilityRefund: number;
  abilityShield: number;
  killBlast: number;
  /** «Раздвоение молнии»: шанс задеть второго врага и доля урона по нему. */
  splitChance: number;
  splitDmg: number;
  perkCostDown: number;
  /** «Раздвоение молнии»: шанс второго разряда по той же цели и его доля урона. */
  echoChance: number;
  echoDmg: number;
  /** Усиление отдельных заклинаний мага. */
  lightningPower: number;
  shotPower: number;
  chainPower: number;

  // ---- таланты пути здоровья
  lowHpDr: number;
  bigHitCut: number;
  startShieldPct: number;
  potionPct: number;
  cheatDeath: number;
  reviveHp: number;
  killHp: number;
  bossHp: number;
  freePerk: boolean;
  healShield: number;
  stepHeal: number;

  // ---- таланты пути защиты
  block: number;
  thorns: number;
  weaken: number;
  firstHitDown: number;
  dotDr: number;
  bossDr: number;
  magicDr: number;
  killDefTurn: number;
  killDefStack: number;
  roomGuard: number;
  counterBuff: number;
  highHpDef: number;
  resDef: number;
  perkDef: number;
  scarDef: number;
  manaShield: number;

  perks: string[];
  /** Способности с кнопкой на поле боя (в порядке слотов). */
  abilities: PerkDef[];
  /** Пассивные способности класса. */
  passives: Set<AbilityId>;
}
