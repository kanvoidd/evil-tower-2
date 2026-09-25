import {
  CLASSES,
  type ClassId,
  type EquipmentSave,
  hasButton,
  ITEM_BY_ID,
  LINEAGES,
  PERK_BY_ID,
} from '../../catalog';
import { ATTACK_STRATEGIES, CombatBalance, type PlayerStats } from '../../combat';
import { Percent, Ratio } from '../../shared';
import type { LineageSave } from '../skill-tree/interfaces/LineageSave';
import { activePerkIds, talentBonuses, talentBonuses2, TREES } from '../skill-tree/skillTree';

export interface Loadout {
  classId: ClassId;
  lineage: LineageSave;
  weapon: EquipmentSave | null;
  armor: EquipmentSave | null;
}

/** Бонус таланта задан в процентах (+20 %), в характеристиках героя он — доля (0,2). */
const asRatio = (pct: number): Ratio => Percent.toRatio(Percent.of(pct));

const usable = (e: EquipmentSave | null): EquipmentSave | null =>
  e && e.durability > 0 && ITEM_BY_ID[e.id] ? e : null;

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
  const armorMul = 1 + asRatio(g('armorBonus'));
  const armorDef = a ? ITEM_BY_ID[a.id].defense * armorMul : 0;
  const armorHp = a ? ITEM_BY_ID[a.id].health * armorMul : 0;
  const weaponDmg = w ? ITEM_BY_ID[w.id].damage : 0;

  const rawDamage = lin.base.damage + (cls.mods.damage ?? 0) + weaponDmg;
  const rawHp = lin.base.health + (cls.mods.health ?? 0) + armorHp;

  const s: PlayerStats = {
    classId: l.classId,
    lineage: cls.lineage,
    resource: lin.resource,
    maxHp: Math.max(1, Math.round(rawHp * (1 + asRatio(g('hpPct'))))),
    damage: Math.max(1, Math.round(rawDamage * (1 + asRatio(g('dmgPct'))))),
    crit: Percent.of(Math.min(CAPS.crit, lin.base.crit + (cls.mods.crit ?? 0) + g('crit'))),
    dodge: Percent.of(Math.min(CAPS.dodge, lin.base.dodge + (cls.mods.dodge ?? 0) + g('dodge'))),
    parry: Percent.of(Math.min(CAPS.parry, lin.base.parry + (cls.mods.parry ?? 0) + g('parry'))),
    defense: Math.round(lin.base.defense + (cls.mods.defense ?? 0) + armorDef + g('def')),
    luck: lin.base.luck + (cls.mods.luck ?? 0),
    resMax: Math.max(1, Math.round(lin.resMax * (1 + asRatio(g('resMaxPct'))))),
    regen: lin.resRegen,
    attack: ATTACK_STRATEGIES[lin.attack],
    rangedCost: basicPerk?.cost ?? 0,
    critMin: CombatBalance.critMulMin,
    critMax: CombatBalance.critMulMax + asRatio(g('critMul')),
    goldBonus: Ratio.of(lin.goldBonus),
    soulBonus: Ratio.of(0),
    artifactMul: asRatio(g('artifactMul')),
    perkPower: 1 + asRatio(g('perkPower')),

    execute: asRatio(g('execute')),
    pierce: Ratio.of(Math.min(1, asRatio(g('pierce')))),
    doubleStrike: Percent.of(g('doubleStrike')),
    lowHpDmg: asRatio(g('lowHpDmg')),
    fullHpDmg: asRatio(g('fullHpDmg')),
    bossDmg: asRatio(g('bossDmg')),
    ignite: asRatio(g('ignite')),
    killDmg: asRatio(g('killDmg')),
    rageDmg: asRatio(g('rageDmg')),
    goldDmg: asRatio(g('goldDmg')),
    defDmg: asRatio(g('defDmg')),
    everyThird: g('everyThird') > 0,
    roomCrit: g('roomCrit') > 0,
    lifesteal: Ratio.of(0),

    abilityIgnite: Percent.of(g('abilityIgnite')),
    abilityStun: Percent.of(g('abilityStun')),
    abilitySplash: asRatio(g('abilitySplash')),
    abilityPoison: asRatio(g('abilityPoison')),
    abilityVuln: asRatio(g('abilityVuln')),
    abilityCrit: Percent.of(g('abilityCrit')),
    abilityLifesteal: asRatio(g('abilityLifesteal')),
    abilityRefund: asRatio(g('abilityRefund')),
    abilityShield: asRatio(g('abilityShield')),
    killBlast: asRatio(g('killBlast')),
    splitChance: asRatio(g('basicSplit')),
    splitDmg: asRatio(g2('basicSplit')),
    echoChance: asRatio(g('boltEcho')),
    echoDmg: asRatio(g2('boltEcho')),
    lightningPower: asRatio(g('lightningPower')),
    shotPower: asRatio(g('shotPower')),
    chainPower: asRatio(g('chainPower')),
    perkCostDown: g('perkCostDown'),

    lowHpDr: asRatio(g('lowHpDr')),
    bigHitCut: asRatio(g('bigHitCut')),
    startShieldPct: asRatio(g('startShield')),
    potionPct: asRatio(g('potionPct')),
    cheatDeath: g('cheatDeath'),
    reviveHp: asRatio(g('revive')),
    killHp: asRatio(g('killHp')),
    bossHp: asRatio(g('bossHp')),
    freePerk: g('freePerk') > 0,
    healShield: asRatio(g('healShield')),
    stepHeal: asRatio(g('stepHeal')),

    block: Percent.of(Math.min(CAPS.block, g('block'))),
    thorns: asRatio(g('thorns')),
    weaken: asRatio(g('weaken')),
    firstHitDown: asRatio(g('firstHitDown')),
    dotDr: asRatio(g('dotDr')),
    bossDr: asRatio(g('bossDr')),
    magicDr: asRatio(g('magicDr')),
    killDefTurn: asRatio(g('killDefTurn')),
    killDefStack: asRatio(g('killDefStack')),
    roomGuard: asRatio(g('roomGuard')),
    counterBuff: asRatio(g('counterBuff')),
    highHpDef: asRatio(g('highHpDef')),
    resDef: asRatio(g('resDef')),
    perkDef: asRatio(g('perkDef')),
    scarDef: asRatio(g('scarDef')),
    manaShield: asRatio(g('manaShield')),

    perks,
    abilities: perkDefs.filter(hasButton),
    passives: new Set(perkDefs.filter((p) => p.passive).map((p) => p.ability)),
  };

  // «Мгновенное исполнение»: первая способность в комнате бесплатна — учитывается в RoomBattle.
  return s;
};
