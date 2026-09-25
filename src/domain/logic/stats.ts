import type { ClassId, EquipmentSave, LineageId, LineageSave, ResourceKind } from '../types';
import { CLASSES } from '../data/classes';
import { LINEAGES } from '../data/heroes';
import { ITEM_BY_ID } from '../data/items';
import { hasButton, PERK_BY_ID, type AbilityId, type PerkDef } from '../data/perks';
import { GAMEPLAY } from '../gameplay';
import type { IAttackStrategy } from './hero/attack/interfaces/IAttackStrategy';
import { activePerkIds, talentBonuses, talentBonuses2, TREES } from './skillTree';

export interface Loadout {
  classId: ClassId;
  lineage: LineageSave;
  weapon: EquipmentSave | null;
  armor: EquipmentSave | null;
}

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

const usable = (e: EquipmentSave | null): EquipmentSave | null => (e && e.durability > 0 && ITEM_BY_ID[e.id] ? e : null);

/** Потолки: без них дерево талантов и экипировка складываются в неуязвимость. */
export const CAPS = { crit: 60, dodge: 35, parry: 35, block: 20 } as const;

export const buildPlayerStats = (l: Loadout): PlayerStats => {
  const cls = CLASSES[l.classId];
  const lin = LINEAGES[cls.lineage];
  const tree = TREES[cls.lineage];
  const tb = talentBonuses(tree, l.lineage);
  const tb2 = talentBonuses2(tree, l.lineage);
  const g = (k: keyof typeof tb): number => tb[k] ?? 0;
  const g2 = (k: keyof typeof tb2): number => tb2[k] ?? 0;

  // Способности не теряются при метаморфозе: у финального класса в руках весь путь линейки.
  const perks = activePerkIds(tree, l.lineage, l.classId);
  const perkDefs = perks.map((p) => PERK_BY_ID[p]).filter(Boolean);
  const basicPerk = perkDefs.find((p) => p.basic);

  // ---- экипировка
  const w = usable(l.weapon);
  const a = usable(l.armor);
  const armorMul = 1 + g('armorBonus') / 100;
  const armorDef = a ? ITEM_BY_ID[a.id].defense * armorMul : 0;
  const armorHp = a ? ITEM_BY_ID[a.id].health * armorMul : 0;
  const weaponDmg = w ? ITEM_BY_ID[w.id].damage : 0;

  const rawDamage = lin.base.damage + (cls.mods.damage ?? 0) + weaponDmg;
  const rawHp = lin.base.health + (cls.mods.health ?? 0) + armorHp;

  const s: PlayerStats = {
    classId: l.classId,
    lineage: cls.lineage,
    resource: lin.resource,
    maxHp: Math.max(1, Math.round(rawHp * (1 + g('hpPct') / 100))),
    damage: Math.max(1, Math.round(rawDamage * (1 + g('dmgPct') / 100))),
    crit: Math.min(CAPS.crit, lin.base.crit + (cls.mods.crit ?? 0) + g('crit')),
    dodge: Math.min(CAPS.dodge, lin.base.dodge + (cls.mods.dodge ?? 0) + g('dodge')),
    parry: Math.min(CAPS.parry, lin.base.parry + (cls.mods.parry ?? 0) + g('parry')),
    defense: Math.round(lin.base.defense + (cls.mods.defense ?? 0) + armorDef + g('def')),
    luck: lin.base.luck + (cls.mods.luck ?? 0),
    resMax: Math.max(1, Math.round(lin.resMax * (1 + g('resMaxPct') / 100))),
    regen: lin.resRegen,
    attack: lin.attack,
    rangedCost: basicPerk?.cost ?? 0,
    critMin: GAMEPLAY.critMulMin,
    critMax: GAMEPLAY.critMulMax + g('critMul') / 100,
    goldBonus: lin.goldBonus,
    soulBonus: 0,
    artifactMul: g('artifactMul') / 100,
    perkPower: 1 + g('perkPower') / 100,

    execute: g('execute') / 100,
    pierce: Math.min(1, g('pierce') / 100),
    doubleStrike: g('doubleStrike'),
    lowHpDmg: g('lowHpDmg') / 100,
    fullHpDmg: g('fullHpDmg') / 100,
    bossDmg: g('bossDmg') / 100,
    ignite: g('ignite') / 100,
    killDmg: g('killDmg') / 100,
    rageDmg: g('rageDmg') / 100,
    goldDmg: g('goldDmg') / 100,
    defDmg: g('defDmg') / 100,
    everyThird: g('everyThird') > 0,
    roomCrit: g('roomCrit') > 0,
    lifesteal: 0,

    abilityIgnite: g('abilityIgnite'),
    abilityStun: g('abilityStun'),
    abilitySplash: g('abilitySplash') / 100,
    abilityPoison: g('abilityPoison') / 100,
    abilityVuln: g('abilityVuln') / 100,
    abilityCrit: g('abilityCrit'),
    abilityLifesteal: g('abilityLifesteal') / 100,
    abilityRefund: g('abilityRefund') / 100,
    abilityShield: g('abilityShield') / 100,
    killBlast: g('killBlast') / 100,
    splitChance: g('basicSplit') / 100,
    splitDmg: g2('basicSplit') / 100,
    echoChance: g('boltEcho') / 100,
    echoDmg: g2('boltEcho') / 100,
    lightningPower: g('lightningPower') / 100,
    shotPower: g('shotPower') / 100,
    chainPower: g('chainPower') / 100,
    perkCostDown: g('perkCostDown'),

    lowHpDr: g('lowHpDr') / 100,
    bigHitCut: g('bigHitCut') / 100,
    startShieldPct: g('startShield') / 100,
    potionPct: g('potionPct') / 100,
    cheatDeath: g('cheatDeath'),
    reviveHp: g('revive') / 100,
    killHp: g('killHp') / 100,
    bossHp: g('bossHp') / 100,
    freePerk: g('freePerk') > 0,
    healShield: g('healShield') / 100,
    stepHeal: g('stepHeal') / 100,

    block: Math.min(CAPS.block, g('block')),
    thorns: g('thorns') / 100,
    weaken: g('weaken') / 100,
    firstHitDown: g('firstHitDown') / 100,
    dotDr: g('dotDr') / 100,
    bossDr: g('bossDr') / 100,
    magicDr: g('magicDr') / 100,
    killDefTurn: g('killDefTurn') / 100,
    killDefStack: g('killDefStack') / 100,
    roomGuard: g('roomGuard') / 100,
    counterBuff: g('counterBuff') / 100,
    highHpDef: g('highHpDef') / 100,
    resDef: g('resDef') / 100,
    perkDef: g('perkDef') / 100,
    scarDef: g('scarDef') / 100,
    manaShield: g('manaShield') / 100,

    perks,
    abilities: perkDefs.filter(hasButton),
    passives: new Set(perkDefs.filter((p) => p.passive).map((p) => p.ability)),
  };

  // «Мгновенное исполнение»: первая способность в комнате бесплатна — учитывается в Run.
  return s;
};
