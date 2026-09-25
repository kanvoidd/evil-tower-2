import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Поджог». */
export class Ignite implements IAbility<'ignite'> {
  readonly behavior = 'ignite';

  apply(ctx: AbilityContext, use: AbilityUse<'ignite'>): void {
    const { ability: p, cell } = use;
    ctx.emit({ type: 'fx', cells: [cell], style: 'fire' });
    ctx.applyBurn(cell, ctx.spellDamage(p.params.burn), p.params.turns);
  }
}
