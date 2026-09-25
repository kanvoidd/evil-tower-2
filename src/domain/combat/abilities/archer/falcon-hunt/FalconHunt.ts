import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Сокол-охотник» (hawkeye_start). */
export class FalconHunt implements IAbility<'falcon_hunt'> {
  readonly id = 'falcon_hunt';

  apply(ctx: AbilityContext, use: AbilityUse<'falcon_hunt'>): void {
    const { perk: p, cell, target } = use;
    ctx.emit({ type: 'fx', cells: [cell], style: 'arrows' });
    ctx.applyStun(cell, p.params.stun);
    ctx.strike(cell, ctx.spellDamage(p.params.dmg), ctx.rollCrit(target, true));
  }
}
