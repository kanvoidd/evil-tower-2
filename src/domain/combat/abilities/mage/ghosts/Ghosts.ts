import type { Card } from '../../../card/Card';
import { UNTIL_DEATH } from '../../../events';
import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Призрачные слуги». */
export class Ghosts implements IAbility<'ghosts'> {
  readonly behavior = 'ghosts';

  apply(ctx: AbilityContext, use: AbilityUse<'ghosts'>): void {
    const { cell, target } = use;
    const e = target!;
    e.haunt = true;
    ctx.emit({ type: 'fx', cells: [cell], style: 'ghost' });
    ctx.emit({ type: 'status', cell, uid: e.uid, kind: 'haunt', turns: UNTIL_DEATH });
  }

  targetable(card: Card): boolean {
    return !card.haunt;
  }
}
