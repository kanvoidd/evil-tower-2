import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Жнец». */
export class Reaper implements IAbility<'reaper'> {
  readonly behavior = 'reaper';

  apply(ctx: AbilityContext, use: AbilityUse<'reaper'>): void {
    const { ability: p, enemies } = use;
    ctx.reaping = p.params.turns;
    ctx.emit({ type: 'fx', cells: enemies, style: 'dark' });
  }

  active(ctx: AbilityContext): boolean {
    return ctx.reaping > 0;
  }
}
