import { type CellIndex } from '../../../../shared';
import { Grid } from '../../../engine/grid/Grid';
import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/**
 * «Цепная молния»: бьёт цель и перескакивает на соседних врагов — от последнего задетого к
 * ближайшему, пока хватает множителей (их число растёт с уровнем перка).
 */
export class ChainLightning implements IAbility<'chain_lightning'> {
  readonly behavior = 'chain_lightning';

  apply(ctx: AbilityContext, use: AbilityUse<'chain_lightning'>): void {
    const { ability: p, cell, enemies } = use;
    const chain: CellIndex[] = [cell];
    while (chain.length < p.params.falloff.length) {
      const last = chain[chain.length - 1];
      const next = enemies
        .filter((c) => !chain.includes(c) && chain.some((x) => Grid.dist(x, c) === 1))
        .sort((a, b) => Grid.dist(last, a) - Grid.dist(last, b) || a - b)[0];
      if (next === undefined) break;
      chain.push(next);
    }
    ctx.emit({ type: 'fx', cells: chain, style: 'chain' });
    const mul = p.params.falloff;
    chain.forEach((c, i) => ctx.strike(c, ctx.spellDamage(mul[i]), false));
  }
}
