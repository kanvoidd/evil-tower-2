import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Удар молнии». */
export class Lightning implements IAbility<'lightning'> {
  readonly behavior = 'lightning';

  apply(ctx: AbilityContext, use: AbilityUse<'lightning'>): void {
    const { ability: p, cell, target } = use;
    ctx.emit({
      type: 'attack',
      from: ctx.playerCell,
      to: cell,
      ranged: true,
      by: 'player',
      style: 'bolt',
    });
    const crit = ctx.rollCrit(target, true);
    let dmg = ctx.spellDamage(p.params.dmg * (1 + ctx.stats.lightningPower));
    if (crit) dmg = Math.max(dmg + 1, Math.round(dmg * ctx.rollCritMul()));
    const killed = ctx.strike(cell, dmg, crit);
    // «Раздвоение молнии»: второй разряд бьёт ту же цель, а не соседа
    const { echoChance, echoDmg } = ctx.stats;
    if (!killed && echoChance > 0 && ctx.rng.chance(echoChance)) {
      ctx.emit({ type: 'fx', cells: [cell], style: 'bolt' });
      ctx.strike(cell, Math.max(1, Math.round(dmg * echoDmg)), false);
    }
  }
}
