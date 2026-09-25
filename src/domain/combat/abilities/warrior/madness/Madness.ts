import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Безумие берсерка». */
export class Madness implements IAbility<'madness'> {
  readonly behavior = 'madness';

  apply(ctx: AbilityContext, use: AbilityUse<'madness'>): void {
    const { ability: p, enemies } = use;
    ctx.madness = p.params.turns;
    ctx.emit({ type: 'fx', cells: enemies, style: 'blades' });
  }

  active(ctx: AbilityContext): boolean {
    return ctx.madness > 0;
  }
}
