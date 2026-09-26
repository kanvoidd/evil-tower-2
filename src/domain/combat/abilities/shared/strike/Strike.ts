import type { AbilityDefOf } from '../../../../catalog';
import type { CellIndex } from '../../../../shared';
import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/**
 * Удар по цели с эффектами — одна механика на «Молнию», «Ледяной шип», «Поджог», «Выстрел
 * скверны» и «Сокола»: урон (если он есть) и то, что способность накладывает поверх, — ослабление,
 * хрупкую броню, горение со взрывом, заморозку, кровотечение, заражение. Какие эффекты — решают
 * числа способности (`params`), а не код.
 */
export class Strike implements IAbility<'strike'> {
  readonly behavior = 'strike';

  apply(ctx: AbilityContext, use: AbilityUse<'strike'>): void {
    const { ability: a, cell, target } = use;
    if (target?.kind !== 'enemy') return;
    if (a.params.dmg > 0 && Strike.hit(ctx, a, cell)) return;
    Strike.debuffs(ctx, a, cell);
    Strike.burn(ctx, a, cell);
    Strike.freeze(ctx, a, cell);
    const p = a.params;
    if (p.bleed) ctx.applyBleed(cell, ctx.spellDamage(p.bleed), p.bleedTurns ?? 1);
    if (p.infect) ctx.applyInfect(cell, p.infect, p.spread ?? 0);
  }

  /** Урон; при полной шкале — прибавка «Молнии». Возвращает true, если цель погибла. */
  private static hit(ctx: AbilityContext, a: AbilityDefOf<'strike'>, cell: CellIndex): boolean {
    const p = a.params;
    let ratio: number = p.dmg;
    if (p.manaAbove !== undefined && p.manaBonus && ctx.castShare() >= p.manaAbove)
      ratio += p.manaBonus;
    const crit = ctx.rollCrit(ctx.cards[cell], true);
    let dmg = ctx.spellDamage(ratio);
    if (crit) dmg = Math.max(dmg + 1, Math.round(dmg * ctx.rollCritMul()));
    return ctx.strike(cell, dmg, crit);
  }

  /** Ослабление и хрупкая броня. */
  private static debuffs(ctx: AbilityContext, a: AbilityDefOf<'strike'>, cell: CellIndex): void {
    const p = a.params;
    const turns = p.debuffTurns ?? 1;
    if (p.weaken) ctx.applyWeaken(cell, p.weaken, turns);
    if (p.armorBreak) ctx.applyArmorBreak(cell, p.armorBreak, turns);
  }

  /** Горение копит тики; набралось `burstAt` — цель взрывается («Воспламенение»). */
  private static burn(ctx: AbilityContext, a: AbilityDefOf<'strike'>, cell: CellIndex): void {
    const p = a.params;
    if (!p.burn) return;
    ctx.applyBurn(cell, ctx.spellDamage(p.burn), p.ticks ?? 1);
    const burning = ctx.cards[cell];
    if (p.burstAt && burning?.kind === 'enemy' && burning.burn >= p.burstAt)
      ctx.explodeBurn(cell, p.burstMul ?? 1, p.burstSplash ?? 0);
  }

  /** «Заморозка»: с шансом цель пропускает удары. */
  private static freeze(ctx: AbilityContext, a: AbilityDefOf<'strike'>, cell: CellIndex): void {
    const p = a.params;
    if (p.freeze && ctx.cards[cell]?.kind === 'enemy' && ctx.rng.chance(p.freeze))
      ctx.applyStun(cell, p.freezeTurns ?? 1);
  }
}
