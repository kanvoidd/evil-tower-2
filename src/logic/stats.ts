import type { ClassId, EquipmentSave, LineageSave, ResourceKind } from '../types';
import { CLASSES, LINEAGES } from '../data/classes';
import { ITEM_BY_ID } from '../data/items';
import { PERK_BY_ID } from '../data/perks';
import { GAMEPLAY } from '../config';
import { activePerkIds, TREES, treeBonuses } from './skillTree';

export interface Loadout {
  classId: ClassId;
  lineage: LineageSave;
  weapon: EquipmentSave | null;
  armor: EquipmentSave | null;
}

export interface PlayerStats {
  classId: ClassId;
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
  attackCost: number;
  rangedCost: number;
  ranged: 'none' | 'skip' | 'any';
  spellMul: number;
  /** Границы случайного множителя крита: каждый крит бьёт с новым множителем из этого диапазона. */
  critMin: number;
  critMax: number;
  rangedMul: number;
  goldBonus: number;
  soulBonus: number;
  artifactMul: number;
  lifesteal: number;
  thorns: number;
  execute: number;
  splash: number;
  startShield: number;
  onKillHeal: number;
  onKillResource: number;
  burst: { cost: number; mul: number } | null;
  perks: string[];
}

const usable = (e: EquipmentSave | null): EquipmentSave | null => (e && e.durability > 0 && ITEM_BY_ID[e.id] ? e : null);

export const buildPlayerStats = (l: Loadout): PlayerStats => {
  const cls = CLASSES[l.classId];
  const lin = LINEAGES[cls.lineage];
  const tree = TREES[cls.lineage];
  const tb = treeBonuses(tree, l.lineage);

  const s: PlayerStats = {
    classId: l.classId,
    resource: lin.resource,
    maxHp: lin.base.health + tb.health + (cls.mods.health ?? 0),
    damage: lin.base.damage + tb.damage + (cls.mods.damage ?? 0),
    crit: lin.base.crit + tb.crit + (cls.mods.crit ?? 0),
    dodge: lin.base.dodge + tb.dodge + (cls.mods.dodge ?? 0),
    parry: lin.base.parry + tb.parry + (cls.mods.parry ?? 0),
    defense: lin.base.defense + tb.defense + (cls.mods.defense ?? 0),
    luck: lin.base.luck + tb.luck + (cls.mods.luck ?? 0),
    resMax: lin.resMax,
    regen: lin.resRegen,
    attackCost: lin.attackCost,
    rangedCost: lin.rangedCost,
    ranged: lin.ranged,
    spellMul: lin.spellMul,
    critMin: GAMEPLAY.critMulMin,
    critMax: GAMEPLAY.critMulMax,
    rangedMul: 1,
    goldBonus: 0,
    soulBonus: 0,
    artifactMul: 0,
    lifesteal: 0,
    thorns: 0,
    execute: 0,
    splash: 0,
    startShield: 0,
    onKillHeal: 0,
    onKillResource: 0,
    burst: null,
    perks: [],
  };

  const w = usable(l.weapon);
  if (w) s.damage += ITEM_BY_ID[w.id].damage;
  const a = usable(l.armor);
  if (a) {
    s.defense += ITEM_BY_ID[a.id].defense;
    s.maxHp += ITEM_BY_ID[a.id].health;
  }

  s.perks = activePerkIds(tree, l.lineage, l.classId);
  for (const pid of s.perks) {
    const perk = PERK_BY_ID[pid];
    if (!perk) continue;
    for (const fx of perk.effects) {
      switch (fx.type) {
        case 'stat':
          if (fx.stat === 'resMax') s.resMax += fx.add;
          else if (fx.stat === 'regen') s.regen += fx.add;
          else if (fx.stat === 'attackCost') s.attackCost = Math.max(0, s.attackCost + fx.add);
          else if (fx.stat === 'health') s.maxHp += fx.add;
          else s[fx.stat] += fx.add;
          break;
        case 'onKillHeal': s.onKillHeal += fx.amount; break;
        case 'onKillResource': s.onKillResource += fx.amount; break;
        case 'burst': s.burst = { cost: fx.cost, mul: fx.mul }; break;
        case 'thorns': s.thorns += fx.ratio; break;
        case 'lifesteal': s.lifesteal += fx.ratio; break;
        case 'startShield': s.startShield += fx.amount; break;
        case 'goldBonus': s.goldBonus += fx.ratio; break;
        case 'soulBonus': s.soulBonus += fx.ratio; break;
        case 'execute': s.execute = Math.max(s.execute, fx.ratio); break;
        case 'splash': s.splash += fx.ratio; break;
        case 'rangedCost': s.rangedCost = Math.max(1, s.rangedCost + fx.add); break;
        case 'rangedMul': s.rangedMul += fx.ratio; break;
        case 'critMul':
          s.critMin += fx.add;
          s.critMax += fx.add;
          break;
        case 'artifactMul': s.artifactMul += fx.ratio; break;
      }
    }
  }
  s.crit = Math.min(s.crit, 75);
  s.dodge = Math.min(s.dodge, 60);
  s.parry = Math.min(s.parry, 50);
  return s;
};
