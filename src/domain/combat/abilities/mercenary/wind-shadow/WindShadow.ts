import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Тень ветра» (ninja_legend). */
export class WindShadow implements IAbility<'wind_shadow'> {
  readonly id = 'wind_shadow';

  apply(ctx: AbilityContext, use: AbilityUse<'wind_shadow'>): void {
    const { perk: p, enemies } = use;
    ctx.emit({ type: 'fx', cells: enemies, style: 'blades' });
    for (const c of ctx.enemyCells()) {
      if (ctx.strike(c, ctx.spellDamage(p.params.dmg), false)) continue;
      let dmg = ctx.spellDamage(p.params.dmg);
      dmg = Math.max(dmg + 1, Math.round(dmg * ctx.rollCritMul()));
      ctx.strike(c, dmg, true);
    }
  }
}
