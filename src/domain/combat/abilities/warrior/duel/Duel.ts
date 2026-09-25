import { Grid } from '../../../engine/grid/Grid';
import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Вызов на дуэль». */
export class Duel implements IAbility<'duel'> {
  readonly behavior = 'duel';

  apply(ctx: AbilityContext, use: AbilityUse<'duel'>): void {
    const { ability: p, enemies } = use;
    let best = Grid.NO_CELL;
    let bestAtk = -1;
    for (const c of enemies) {
      if (ctx.cards[c]!.atk > bestAtk) {
        bestAtk = ctx.cards[c]!.atk;
        best = c;
      }
    }
    if (best < 0) return;
    ctx.emit({ type: 'fx', cells: [best], style: 'swap' });
    const free =
      Grid.neighbors(ctx.playerCell).find((n) => !ctx.cards[n]) ??
      Grid.neighbors(ctx.playerCell)[0];
    if (free !== best) ctx.engine.swap(best, free);
    ctx.applyStun(free, p.params.stun);
  }
}
