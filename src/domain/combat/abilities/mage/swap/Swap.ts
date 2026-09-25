import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Перестановка» (magister_start). */
export class Swap implements IAbility<'swap'> {
  readonly id = 'swap';

  apply(ctx: AbilityContext, use: AbilityUse<'swap'>): void {
    const { cell } = use;
    const a = ctx.swapFirst!;
    const b = cell;
    if (a === b) return;
    ctx.emit({ type: 'fx', cells: [a, b], style: 'swap' });
    ctx.engine.swap(a, b);
  }
}
