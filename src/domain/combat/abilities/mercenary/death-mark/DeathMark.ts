import type { Card } from '../../../card/Card';
import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Клеймо смерти». */
export class DeathMark implements IAbility<'death_mark'> {
  readonly behavior = 'death_mark';

  apply(ctx: AbilityContext, use: AbilityUse<'death_mark'>): void {
    const { ability: p, cell, target } = use;
    const e = target!;
    e.mark = p.params.turns;
    ctx.emit({ type: 'status', cell, uid: e.uid, kind: 'mark', turns: e.mark });
  }

  targetable(card: Card): boolean {
    return !(card.mark > 0);
  }
}
