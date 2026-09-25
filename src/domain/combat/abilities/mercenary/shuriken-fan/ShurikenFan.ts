import { Grid } from '../../../engine/grid/Grid';
import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Веер сюрикенов». */
export class ShurikenFan implements IAbility<'shuriken_fan'> {
  readonly behavior = 'shuriken_fan';

  apply(ctx: AbilityContext, use: AbilityUse<'shuriken_fan'>): void {
    const { ability: p, enemies } = use;
    const list = [...enemies]
      .sort((a, b) => Grid.dist(ctx.playerCell, a) - Grid.dist(ctx.playerCell, b))
      .slice(0, p.params.targets);
    ctx.emit({ type: 'fx', cells: list, style: 'blades' });
    for (const c of list)
      ctx.strike(c, ctx.spellDamage(p.params.dmg), ctx.rollCrit(ctx.cards[c], true));
  }
}
