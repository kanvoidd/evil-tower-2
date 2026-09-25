import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Жатва теней» (darkassassin_p3). */
export class ShadowReap implements IAbility<'shadow_reap'> {
  readonly id = 'shadow_reap';

  apply(ctx: AbilityContext, use: AbilityUse<'shadow_reap'>): void {
    const { perk: p, enemies } = use;
    const marked = enemies.filter((c) => (ctx.cards[c]?.mark ?? 0) > 0);
    ctx.emit({ type: 'fx', cells: marked, style: 'dark' });
    for (const c of marked) ctx.reapMarked(c, p.params.bossHpShare);
  }
}
