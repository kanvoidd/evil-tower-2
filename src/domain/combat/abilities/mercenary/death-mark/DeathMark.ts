import type { Card } from '../../../card/Card';
import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Клеймо смерти» (darkassassin_start). */
export class DeathMark implements IAbility<'death_mark'> {
  readonly id = 'death_mark';

  apply(ctx: AbilityContext, use: AbilityUse<'death_mark'>): void {
    const { perk: p, cell, target } = use;
    const e = target!;
    e.mark = p.params.turns;
    ctx.emit({ type: 'status', cell, uid: e.uid, kind: 'mark', turns: e.mark });
  }

  targetable(card: Card): boolean {
    return !(card.mark > 0);
  }
}
