import { type CellIndex } from '../../../../shared';
import { Grid } from '../../../engine/grid/Grid';
import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Цепная молния». */
export class ChainLightning implements IAbility<'chain_lightning'> {
  readonly behavior = 'chain_lightning';

  apply(ctx: AbilityContext, use: AbilityUse<'chain_lightning'>): void {
    const { ability: p, cell } = use;
    const chain: CellIndex[] = [cell];
    const seen = new Set<CellIndex>([cell]);
    for (const n of Grid.neighbors(cell)) {
      if (
        ctx.cards[n]?.kind === 'enemy' &&
        !seen.has(n) &&
        chain.length < p.params.falloff.length
      ) {
        chain.push(n);
        seen.add(n);
      }
    }
    ctx.emit({ type: 'fx', cells: chain, style: 'chain' });
    const power = 1 + ctx.stats.chainPower;
    const mul = p.params.falloff;
    chain.forEach((c, i) => ctx.strike(c, ctx.spellDamage(mul[i] * power), false));
  }
}
