import { Grid } from '../../../engine/grid/Grid';
import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Вихрь» (berserk_start). */
export class Whirlwind implements IAbility<'whirlwind'> {
  readonly id = 'whirlwind';

  apply(ctx: AbilityContext, use: AbilityUse<'whirlwind'>): void {
    const { perk: p } = use;
    const near = Grid.neighbors(ctx.playerCell).filter((c) => ctx.cards[c]?.kind === 'enemy');
    ctx.emit({ type: 'fx', cells: near, style: 'blades' });
    const dmg = ctx.spellDamage(p.params.dmg);
    for (const c of near) ctx.damageEnemy(c, dmg, ctx.rollCrit(ctx.cards[c], false), true);
  }
}
