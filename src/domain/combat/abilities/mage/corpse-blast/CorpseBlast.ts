import type { Card } from '../../../card/Card';
import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Взрыв трупа» (necromancer_start). */
export class CorpseBlast implements IAbility<'corpse_blast'> {
  readonly id = 'corpse_blast';

  apply(ctx: AbilityContext, use: AbilityUse<'corpse_blast'>): void {
    const { cell, target } = use;
    const e = target!;
    e.corpse = true;
    ctx.emit({ type: 'fx', cells: [cell], style: 'corpse' });
    ctx.emit({ type: 'status', cell, uid: e.uid, kind: 'corpse', turns: 99 });
  }

  targetable(card: Card): boolean {
    return !card.corpse;
  }
}
