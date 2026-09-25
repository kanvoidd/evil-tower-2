import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Инферно». */
export class Inferno implements IAbility<'inferno'> {
  readonly behavior = 'inferno';

  apply(ctx: AbilityContext, use: AbilityUse<'inferno'>): void {
    const { ability: p, enemies } = use;
    ctx.emit({ type: 'fx', cells: enemies, style: 'fire' });
    const burn = ctx.spellDamage(p.params.burn);
    for (const c of enemies) ctx.applyBurn(c, burn, p.params.turns);
  }
}
