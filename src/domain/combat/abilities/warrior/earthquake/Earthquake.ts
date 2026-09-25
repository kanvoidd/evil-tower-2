import { Grid } from '../../../engine/grid/Grid';
import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Землетрясение» (warrior_p2). */
export class Earthquake implements IAbility<'earthquake'> {
  readonly id = 'earthquake';

  apply(ctx: AbilityContext, use: AbilityUse<'earthquake'>): void {
    const { perk: p, enemies } = use;
    const hit = enemies.filter(
      (c) => Grid.row(c) === Grid.row(ctx.playerCell) || Grid.col(c) === Grid.col(ctx.playerCell),
    );
    ctx.emit({ type: 'fx', cells: hit, style: 'quake' });
    const dmg = ctx.spellDamage(p.params.dmg);
    for (const c of hit) {
      ctx.applyStun(c, p.params.stun);
      ctx.damageEnemy(c, dmg, false);
    }
  }
}
