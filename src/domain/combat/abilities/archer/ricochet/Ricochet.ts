import { Grid } from '../../../engine/grid/Grid';
import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Рикошет» (archer_p3). */
export class Ricochet implements IAbility<'ricochet'> {
  readonly id = 'ricochet';

  apply(ctx: AbilityContext, use: AbilityUse<'ricochet'>): void {
    const { perk: p, cell } = use;
    const chain = [cell];
    for (const n of Grid.neighbors(cell)) {
      if (ctx.cards[n]?.kind === 'enemy' && chain.length < p.params.falloff.length) chain.push(n);
    }
    ctx.emit({
      type: 'attack',
      from: ctx.playerCell,
      to: cell,
      ranged: true,
      by: 'player',
      style: 'shot',
    });
    const mul = p.params.falloff;
    chain.forEach((c, i) =>
      ctx.strike(c, ctx.spellDamage(mul[i]), i === 0 && ctx.rollCrit(ctx.cards[c], true)),
    );
  }
}
