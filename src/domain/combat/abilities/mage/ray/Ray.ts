import { Grid } from '../../../engine/grid/Grid';
import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/**
 * Выстрел по линии от героя в сторону цели («Магический выстрел»): бьёт первых `pierce` врагов на
 * линии, каждого следующего слабее. «Заряд»: пока выстрел ждал, он копил силу — выстрел её тратит.
 */
export class Ray implements IAbility<'ray'> {
  readonly behavior = 'ray';

  apply(ctx: AbilityContext, use: AbilityUse<'ray'>): void {
    const { ability: a, cell } = use;
    const p = a.params;
    const hit = Grid.ray(ctx.playerCell, cell)
      .filter((c) => ctx.cards[c]?.kind === 'enemy')
      .slice(0, Math.max(1, p.pierce));
    const charge = 1 + (p.chargePer ?? 0) * ctx.chargeOf(a.id);
    ctx.resetCharge(a.id);
    if (!hit.length) return;
    ctx.emit({ type: 'cast', ability: a.id, cells: hit });
    const crit = ctx.rollCrit(ctx.cards[hit[0]], true);
    hit.forEach((c, i) => {
      let dmg = ctx.spellDamage(p.dmg * charge * Math.pow(1 - p.stepLoss, i));
      if (crit && i === 0) dmg = Math.max(dmg + 1, Math.round(dmg * ctx.rollCritMul()));
      ctx.strike(c, dmg, crit && i === 0);
    });
  }
}
