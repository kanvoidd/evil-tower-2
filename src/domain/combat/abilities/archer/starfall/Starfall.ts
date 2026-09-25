import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Звездопад» (arrowgod_legend). */
export class Starfall implements IAbility<'starfall'> {
  readonly id = 'starfall';

  apply(ctx: AbilityContext, use: AbilityUse<'starfall'>): void {
    const { perk: p, enemies } = use;
    ctx.emit({ type: 'fx', cells: enemies, style: 'arrows' });
    for (let i = 0; i < p.params.waves; i++) {
      for (const c of ctx.enemyCells()) {
        ctx.strike(c, ctx.spellDamage(p.params.dmg), ctx.rollCrit(ctx.cards[c], true));
      }
    }
  }
}
