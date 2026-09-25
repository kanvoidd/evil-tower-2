import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Детонация». */
export class Detonate implements IAbility<'detonate'> {
  readonly behavior = 'detonate';

  apply(ctx: AbilityContext, use: AbilityUse<'detonate'>): void {
    const { ability: p, enemies } = use;
    const burning = enemies.filter((c) => (ctx.cards[c]?.burn ?? 0) > 0);
    ctx.emit({ type: 'fx', cells: burning, style: 'explosion' });
    for (const c of burning) {
      const e = ctx.cards[c];
      if (!e) continue;
      const blast = Math.max(1, e.burnDmg * p.params.blastMul);
      ctx.splashNeighbors(c, Math.max(1, e.burnDmg * p.params.splashMul));
      ctx.damageEnemy(c, blast, false);
    }
  }
}
