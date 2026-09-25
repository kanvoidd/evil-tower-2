import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Магический выстрел». */
export class MagicShot implements IAbility<'magic_shot'> {
  readonly behavior = 'magic_shot';

  apply(ctx: AbilityContext, use: AbilityUse<'magic_shot'>): void {
    const { ability: p, cell, target } = use;
    ctx.emit({ type: 'fx', cells: [cell], style: 'arcane' });
    const crit = ctx.rollCrit(target, true);
    let dmg = ctx.spellDamage(p.params.dmg * (1 + ctx.stats.shotPower));
    if (crit) dmg = Math.max(dmg + 1, Math.round(dmg * ctx.rollCritMul()));
    ctx.strike(cell, dmg, crit);
  }
}
