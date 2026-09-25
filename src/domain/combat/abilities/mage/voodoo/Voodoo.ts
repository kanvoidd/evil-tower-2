import type { Card } from '../../../card/Card';
import { UNTIL_DEATH } from '../../../events';
import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Кукла вуду» (necromancer_p3). */
export class Voodoo implements IAbility<'voodoo'> {
  readonly id = 'voodoo';

  apply(ctx: AbilityContext, use: AbilityUse<'voodoo'>): void {
    const { cell, target } = use;
    const e = target!;
    e.link = true;
    ctx.emit({ type: 'status', cell, uid: e.uid, kind: 'link', turns: UNTIL_DEATH });
  }

  targetable(card: Card): boolean {
    return !card.link;
  }
}
