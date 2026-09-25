import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Поджог» (pyromancer_start). */
export class Ignite implements IAbility<'ignite'> {
  readonly id = 'ignite';

  apply(ctx: AbilityContext, use: AbilityUse<'ignite'>): void {
    const { perk: p, cell } = use;
    ctx.emit({ type: 'fx', cells: [cell], style: 'fire' });
    ctx.applyBurn(cell, ctx.spellDamage(p.params.burn), p.params.turns);
  }
}
