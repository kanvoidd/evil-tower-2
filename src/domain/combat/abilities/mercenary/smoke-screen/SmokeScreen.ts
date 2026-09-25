import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Дымовая завеса» (ninja_p3). */
export class SmokeScreen implements IAbility<'smoke_screen'> {
  readonly id = 'smoke_screen';

  apply(ctx: AbilityContext, use: AbilityUse<'smoke_screen'>): void {
    const { perk: p } = use;
    ctx.noCounter = p.params.turns;
    ctx.emit({ type: 'fx', cells: [ctx.playerCell], style: 'smoke' });
  }

  active(ctx: AbilityContext): boolean {
    return ctx.noCounter > 0;
  }
}
