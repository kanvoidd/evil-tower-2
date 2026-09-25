import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Жнец» (darkassassin_legend). */
export class Reaper implements IAbility<'reaper'> {
  readonly id = 'reaper';

  apply(ctx: AbilityContext, use: AbilityUse<'reaper'>): void {
    const { perk: p, enemies } = use;
    ctx.reaping = p.params.turns;
    ctx.emit({ type: 'fx', cells: enemies, style: 'dark' });
  }

  active(ctx: AbilityContext): boolean {
    return ctx.reaping > 0;
  }
}
