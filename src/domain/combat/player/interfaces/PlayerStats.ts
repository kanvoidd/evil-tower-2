import type {
  AbilityBehaviorId,
  AbilityDef,
  ClassId,
  LineageId,
  ResourceKind,
} from '../../../catalog';
import type { Percent, Ratio } from '../../../shared';
import type { IAttackStrategy } from '../../attack/interfaces/IAttackStrategy';
import type {
  IDamageReduction,
  IDefenseModifier,
  IHeroDamageModifier,
  ITargetDamageModifier,
} from '../../damage';

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
  /** Стиль боя: бьёт ли герой рукой и чем достаёт дальнего врага (линейка или базовый перк). */
  attack: IAttackStrategy;
  /** Цена базового дальнего действия в ресурсе. */
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
  everyThird: boolean;
  lifesteal: Ratio;

  // ---- синергии: меняют уже полученные способности
  abilityStun: Percent;
  abilitySplash: Ratio;
  abilityPoison: Ratio;
  abilityVuln: Ratio;
  abilityCrit: Percent;
  abilityLifesteal: Ratio;
  abilityRefund: Ratio;
  abilityShield: Ratio;
  /** «Двойной наконечник»: шанс задеть второго врага и доля урона по нему. */
  splitChance: Ratio;
  splitDmg: Ratio;
  perkCostDown: number;
  /** «Поддержка с воздуха»: шанс второго удара по той же цели после базовой атаки и его доля урона. */
  echoChance: Ratio;
  echoDmg: Ratio;
  /** «Перегрузка»: прибавка к урону способностей при полной шкале ресурса (растёт с её долей). */
  overcharge: Ratio;

  // ---- таланты пути здоровья
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
  dotDr: Ratio;
  roomGuard: Ratio;
  counterBuff: Ratio;
  perkDef: Ratio;
  manaShield: Ratio;

  // ---- надбавки и снижения: их выдаёт прогресс героя, бой применяет по порядку
  /** Надбавки к урону героя (множитель и база). */
  damageMods: readonly IHeroDamageModifier[];
  /** Надбавки к урону по конкретному врагу. */
  targetMods: readonly ITargetDamageModifier[];
  /** Надбавки к защите. */
  defenseMods: readonly IDefenseModifier[];
  /** Снижения входящего удара. */
  reductions: readonly IDamageReduction[];

  /**
   * Все способности героя: кнопки, пассивки и базовые действия — с числами его уровня перка и
   * правками талантов.
   */
  allAbilities: AbilityDef[];
  /** Способности с кнопкой на поле боя (в порядке слотов). */
  abilities: AbilityDef[];
  /** Механики пассивных способностей героя. */
  passives: Set<AbilityBehaviorId>;
}
