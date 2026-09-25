import { isHolyTarget } from '../../../../catalog';
import { Grid } from '../../../engine/grid/Grid';
import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Луч правосудия» (paladin_p2). */
export class JusticeBeam implements IAbility<'justice_beam'> {
  readonly id = 'justice_beam';

  apply(ctx: AbilityContext, use: AbilityUse<'justice_beam'>): void {
    const { perk: p, cell, enemies } = use;
    const col = Grid.col(cell);
    const hit = enemies.filter((c) => Grid.col(c) === col);
    ctx.emit({ type: 'fx', cells: hit, style: 'beam' });
    for (const c of hit) {
      const e = ctx.cards[c]!;
      const holy = isHolyTarget(ctx.enemies[e.defId].tag);
      ctx.damageEnemy(c, ctx.spellDamage(holy ? p.params.holyDmg : p.params.dmg), false);
    }
  }
}
