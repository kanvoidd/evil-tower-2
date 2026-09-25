import { Grid } from '../../../engine/grid/Grid';
import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Огненный шар» (pyromancer_p2). */
export class Fireball implements IAbility<'fireball'> {
  readonly id = 'fireball';

  apply(ctx: AbilityContext, use: AbilityUse<'fireball'>): void {
    const { perk: p, cell } = use;
    const near = Grid.neighbors(cell).filter((c) => ctx.cards[c]?.kind === 'enemy');
    ctx.emit({ type: 'fx', cells: [cell, ...near], style: 'explosion' });
    const burn = ctx.spellDamage(p.params.burn);
    ctx.applyBurn(cell, burn, p.params.turns);
    for (const c of near) ctx.applyBurn(c, burn, p.params.turns);
    ctx.strike(cell, ctx.spellDamage(p.params.dmg), false);
    for (const c of near) ctx.damageEnemy(c, ctx.spellDamage(p.params.splash), false);
  }
}
