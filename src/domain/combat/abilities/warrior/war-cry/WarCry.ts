import { UNTIL_DEATH } from '../../../events';
import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Боевой клич» (knight_p2). */
export class WarCry implements IAbility<'war_cry'> {
  readonly id = 'war_cry';

  apply(ctx: AbilityContext, use: AbilityUse<'war_cry'>): void {
    const { perk: p, enemies } = use;
    ctx.warCry = Math.min(p.params.cap, ctx.warCry + ctx.pp(p.params.weaken, p.params.cap));
    ctx.emit({ type: 'fx', cells: enemies, style: 'banner' });
    for (const c of enemies) {
      const e = ctx.cards[c]!;
      ctx.emit({ type: 'status', cell: c, uid: e.uid, kind: 'weak', turns: UNTIL_DEATH });
    }
  }
}
