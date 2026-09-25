import type { Card } from '../../../card/Card';
import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Приговор» (assassin_p2). */
export class Sentence implements IAbility<'sentence'> {
  readonly id = 'sentence';

  apply(ctx: AbilityContext, use: AbilityUse<'sentence'>): void {
    const { perk: p, cell, target } = use;
    const e = target!;
    e.vuln = Math.max(e.vuln, ctx.pp(p.params.vuln, p.params.cap));
    ctx.emit({ type: 'status', cell, uid: e.uid, kind: 'vuln', turns: 99 });
  }

  targetable(card: Card): boolean {
    return !(card.vuln > 0);
  }
}
