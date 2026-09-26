import { CombatBalance } from '../../../balance';
import type { Card } from '../../../card/Card';
import { CritPolicy } from '../../../crit';
import type { HeroView } from '../../../damage';
import type { RoomState } from '../../room-state/RoomState';
import { BattleHeroView } from '../hero-view/BattleHeroView';
import type { RoomParts } from '../interfaces/RoomParts';
import { RoomPart } from '../room-part/RoomPart';

/** Расчёт урона и защиты: урон героя и по цели, броня, крит, снижение входящего удара. */
export class DamageCalc extends RoomPart {
  /** Герой глазами правил урона и защиты — живые значения этого боя. */
  readonly hero: HeroView;
  /** Кто решает крит: правила героя на этот бой (у некоторых — своё состояние). */
  private readonly crit: CritPolicy;

  constructor(state: RoomState, parts: RoomParts) {
    super(state, parts);
    this.hero = new BattleHeroView(state, parts);
    this.crit = CritPolicy.forHero(state.stats);
  }

  // ------------------------------------------------------------------ расчёт урона

  /** Урон героя с учётом временных надбавок (резня, ярость, золото, удар щитом). */
  currentDamage(): number {
    const acc = { base: this.state.stats.damage, mul: 1 };
    for (const m of this.state.stats.damageMods) m.apply(acc, this.hero);
    return Math.max(1, Math.round(acc.base * acc.mul));
  }

  /** Надбавки, зависящие от цели. */
  contextDamage(dmg: number, enemy: Card): number {
    const def = this.state.enemies[enemy.defId];
    let mul = 1;
    for (const m of this.state.stats.targetMods) mul += m.bonus(enemy, def);
    return Math.max(1, Math.round(dmg * mul));
  }

  /** Броня врага (пробивание героя, хрупкая броня, удар вплотную «Залпом болтом») и «Приговор». */
  afterArmor(dmg: number, enemy: Card): number {
    const def = this.state.enemies[enemy.defId];
    const brittle = enemy.brittle > 0 ? enemy.brittleShare : 0;
    const armor = this.state.ignoreArmor
      ? 0
      : Math.max(0, Math.round((def?.armor ?? 0) * (1 - this.state.stats.pierce) * (1 - brittle)));
    let out = Math.max(1, dmg - armor);
    if (enemy.vuln > 0) out = Math.round(out * (1 + enemy.vuln));
    return Math.max(1, out);
  }

  rollCritMul(): number {
    const { critMin, critMax } = this.state.stats;
    return critMin + this.state.rng.next() * (critMax - critMin);
  }

  /** Множитель силы способностей. */
  pp(value: number, cap = Infinity): number {
    return Math.min(cap, value * this.state.stats.perkPower);
  }

  /**
   * Урон способности: доля от базового урона героя, усиленная талантом «перк класса сильнее» и
   * «Перегрузкой» — чем полнее была шкала в момент применения, тем сильнее.
   */
  spellDamage(ratio: number): number {
    const over = 1 + this.state.stats.overcharge * this.castShare();
    return Math.max(
      1,
      Math.round(this.currentDamage() * ratio * this.state.stats.perkPower * over),
    );
  }

  /** Доля шкалы ресурса в момент применения способности (вне способности — сейчас). */
  castShare(): number {
    const res = this.state.inAbility ? this.state.castRes : this.state.res;
    return this.state.stats.resMax > 0 ? res / this.state.stats.resMax : 0;
  }

  rollCrit(enemy: Card | null, ranged: boolean): boolean {
    return this.crit.decide({
      enemy,
      ranged,
      inAbility: this.state.inAbility,
      rng: this.state.rng,
    });
  }

  // ------------------------------------------------------------------ ответный удар врага

  defenseNow(): number {
    let def = this.state.stats.defense;
    for (const m of this.state.stats.defenseMods) def = m.apply(def, this.hero);
    return this.state.wardTurns > 0 ? def + this.state.wardDefense : def;
  }

  /** Урон по герою от удара силой atk (для подсказок и автоприменения). */
  strikeDamage(atk: number): number {
    return this.reduce(atk, null);
  }

  reduce(atk: number, enemy: Card | null): number {
    const hit = { enemy, def: enemy ? this.state.enemies[enemy.defId] : null, hero: this.hero };
    let dmg = atk;
    for (const r of this.state.stats.reductions) dmg = r.apply(dmg, hit);
    const armor = this.defenseNow();
    const floor = Math.ceil(dmg * (1 - CombatBalance.maxDefenseReduction));
    return Math.max(1, Math.round(Math.max(floor, dmg - armor)));
  }
}
