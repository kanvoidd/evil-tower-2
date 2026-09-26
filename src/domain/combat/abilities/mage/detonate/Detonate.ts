import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Детонация»: все горящие враги взрываются разом, не дожидаясь порога «Воспламенения». */
export class Detonate implements IAbility<'detonate'> {
  readonly behavior = 'detonate';

  apply(ctx: AbilityContext, use: AbilityUse<'detonate'>): void {
    const { ability: p, enemies } = use;
    const burning = enemies.filter((c) => (ctx.cards[c]?.burn ?? 0) > 0);
    ctx.emit({ type: 'cast', ability: p.id, cells: burning });
    for (const c of burning) ctx.explodeBurn(c, p.params.blastMul, p.params.splashMul);
  }
}
