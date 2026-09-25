import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Безумие берсерка» (berserk_legend). */
export class Madness implements IAbility<'madness'> {
  readonly id = 'madness';

  apply(ctx: AbilityContext, use: AbilityUse<'madness'>): void {
    const { perk: p, enemies } = use;
    ctx.madness = p.params.turns;
    ctx.emit({ type: 'fx', cells: enemies, style: 'blades' });
  }

  active(ctx: AbilityContext): boolean {
    return ctx.madness > 0;
  }
}
