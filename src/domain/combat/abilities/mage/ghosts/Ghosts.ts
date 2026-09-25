import type { Card } from '../../../card/Card';
import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Призрачные слуги» (necromancer_p2). */
export class Ghosts implements IAbility<'ghosts'> {
  readonly id = 'ghosts';

  apply(ctx: AbilityContext, use: AbilityUse<'ghosts'>): void {
    const { cell, target } = use;
    const e = target!;
    e.haunt = true;
    ctx.emit({ type: 'fx', cells: [cell], style: 'ghost' });
    ctx.emit({ type: 'status', cell, uid: e.uid, kind: 'haunt', turns: 99 });
  }

  targetable(card: Card): boolean {
    return !card.haunt;
  }
}
