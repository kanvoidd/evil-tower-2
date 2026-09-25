import type { Card } from '../../../card/Card';
import { UNTIL_DEATH } from '../../../events';
import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Приговор». */
export class Sentence implements IAbility<'sentence'> {
  readonly behavior = 'sentence';

  apply(ctx: AbilityContext, use: AbilityUse<'sentence'>): void {
    const { ability: p, cell, target } = use;
    const e = target!;
    e.vuln = Math.max(e.vuln, ctx.pp(p.params.vuln, p.params.cap));
    ctx.emit({ type: 'status', cell, uid: e.uid, kind: 'vuln', turns: UNTIL_DEATH });
  }

  targetable(card: Card): boolean {
    return !(card.vuln > 0);
  }
}
