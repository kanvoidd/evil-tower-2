import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Дождь стрел». */
export class ArrowRain implements IAbility<'arrow_rain'> {
  readonly behavior = 'arrow_rain';

  apply(ctx: AbilityContext, use: AbilityUse<'arrow_rain'>): void {
    const { ability: p, enemies } = use;
    if (!enemies.length) return;
    ctx.emit({ type: 'fx', cells: enemies, style: 'arrows' });
    for (let i = 0; i < p.params.arrows; i++) {
      const live = ctx.enemyCells();
      if (!live.length) break;
      const c = live[ctx.rng.int(0, live.length - 1)];
      ctx.strike(c, ctx.spellDamage(p.params.dmg), ctx.rollCrit(ctx.cards[c], true));
    }
  }
}
