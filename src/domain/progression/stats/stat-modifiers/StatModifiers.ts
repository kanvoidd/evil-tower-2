import { type AbilityDef, type TalentFx, withBehavior } from '../../../catalog';
import {
  ArmorToDamage,
  BigHitReduction,
  BossBonus,
  BossReduction,
  CarnageBonus,
  FirstHitReduction,
  FullHpBonus,
  GoldBonus,
  HighHpDefense,
  type IDamageReduction,
  type IDefenseModifier,
  type IHeroDamageModifier,
  type ITargetDamageModifier,
  KillBonus,
  KillStackDefense,
  KillTurnDefense,
  LowHpBonus,
  LowHpReduction,
  MagicReduction,
  RageBonus,
  ResourceDefense,
  ScarDefense,
  WoundedEnemyReduction,
} from '../../../combat';
import { Percent, type Ratio } from '../../../shared';

/** Сумма значений талантов героя по виду эффекта (в процентах, как в дереве). */
type TalentSum = (fx: TalentFx) => number;

/**
 * Надбавки и снижения из талантов и пассивок героя. Порядок в каждом списке — тот, в каком бой
 * их применяет: порядок сложения и округлений — часть баланса. Талант без рангов надбавки не даёт.
 */
export class StatModifiers {
  /** Надбавки к урону героя: «Кровь кипит», за убийства, за золото, «Резня», защита в урон. */
  static damage(g: TalentSum, passives: readonly AbilityDef[]): IHeroDamageModifier[] {
    const out: IHeroDamageModifier[] = [];
    const share = StatModifiers.share;
    if (g('rageDmg') > 0) out.push(new RageBonus(share(g('rageDmg'))));
    if (g('killDmg') > 0) out.push(new KillBonus(share(g('killDmg'))));
    if (g('goldDmg') > 0) out.push(new GoldBonus(share(g('goldDmg'))));
    const carnage = withBehavior(passives, 'carnage');
    if (carnage) {
      const { perKill, cap } = carnage.params;
      out.push(new CarnageBonus(perKill, cap));
    }
    if (g('defDmg') > 0) out.push(new ArmorToDamage(share(g('defDmg'))));
    return out;
  }

  /** Надбавки к урону по врагу: полное здоровье, раненый, босс. */
  static target(g: TalentSum): ITargetDamageModifier[] {
    const out: ITargetDamageModifier[] = [];
    const share = StatModifiers.share;
    if (g('fullHpDmg') > 0) out.push(new FullHpBonus(share(g('fullHpDmg'))));
    if (g('lowHpDmg') > 0) out.push(new LowHpBonus(share(g('lowHpDmg'))));
    if (g('bossDmg') > 0) out.push(new BossBonus(share(g('bossDmg'))));
    return out;
  }

  /** Надбавки к защите: много здоровья, полная шкала, шрамы, убийства в комнате, ход после убийства. */
  static defense(g: TalentSum): IDefenseModifier[] {
    const out: IDefenseModifier[] = [];
    const share = StatModifiers.share;
    if (g('highHpDef') > 0) out.push(new HighHpDefense(share(g('highHpDef'))));
    if (g('resDef') > 0) out.push(new ResourceDefense(share(g('resDef'))));
    if (g('scarDef') > 0) out.push(new ScarDefense(share(g('scarDef'))));
    if (g('killDefStack') > 0) out.push(new KillStackDefense(share(g('killDefStack'))));
    if (g('killDefTurn') > 0) out.push(new KillTurnDefense(share(g('killDefTurn'))));
    return out;
  }

  /** Снижения удара: первый удар врага, раненый враг, магия, босс, мало здоровья, тяжёлый удар. */
  static reductions(g: TalentSum): IDamageReduction[] {
    const out: IDamageReduction[] = [];
    const share = StatModifiers.share;
    if (g('firstHitDown') > 0) out.push(new FirstHitReduction(share(g('firstHitDown'))));
    if (g('weaken') > 0) out.push(new WoundedEnemyReduction(share(g('weaken'))));
    if (g('magicDr') > 0) out.push(new MagicReduction(share(g('magicDr'))));
    if (g('bossDr') > 0) out.push(new BossReduction(share(g('bossDr'))));
    if (g('lowHpDr') > 0) out.push(new LowHpReduction(share(g('lowHpDr'))));
    if (g('bigHitCut') > 0) out.push(new BigHitReduction(share(g('bigHitCut'))));
    return out;
  }

  /** Значение таланта задано в процентах (+20 %), модификатору нужна доля (0,2). */
  private static share(pct: number): Ratio {
    return Percent.toRatio(Percent.of(pct));
  }
}
