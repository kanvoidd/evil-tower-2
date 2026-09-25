import { isHolyTarget } from '../../../../catalog';
import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Святая кара». */
export class HolyWrath implements IAbility<'holy_wrath'> {
  readonly behavior = 'holy_wrath';

  apply(ctx: AbilityContext, use: AbilityUse<'holy_wrath'>): void {
    const { ability: p, cell, target } = use;
    const enemy = target!;
    const holy = isHolyTarget(ctx.enemies[enemy.defId].tag);
    let dmg = ctx.spellDamage(holy ? p.params.holyDmg : p.params.dmg);
    const crit = ctx.rollCrit(enemy, false);
    if (crit) dmg = Math.max(dmg + 1, Math.round(dmg * ctx.rollCritMul()));
    ctx.emit({ type: 'fx', cells: [cell], style: 'holy' });
    const killed = ctx.strike(cell, dmg, crit);
    if (killed) ctx.stepInto(cell);
  }
}
