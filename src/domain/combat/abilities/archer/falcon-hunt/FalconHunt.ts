import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Сокол-охотник». */
export class FalconHunt implements IAbility<'falcon_hunt'> {
  readonly behavior = 'falcon_hunt';

  apply(ctx: AbilityContext, use: AbilityUse<'falcon_hunt'>): void {
    const { ability: p, cell, target } = use;
    ctx.emit({ type: 'fx', cells: [cell], style: 'arrows' });
    ctx.applyStun(cell, p.params.stun);
    ctx.strike(cell, ctx.spellDamage(p.params.dmg), ctx.rollCrit(target, true));
  }
}
