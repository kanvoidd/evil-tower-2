import { Grid } from '../../../engine/grid/Grid';
import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Пробивающий выстрел» (sniper_start). */
export class RailShot implements IAbility<'rail_shot'> {
  readonly id = 'rail_shot';

  apply(ctx: AbilityContext, use: AbilityUse<'rail_shot'>): void {
    const { perk: p, cell, enemies } = use;
    const line = enemies.filter(
      (c) => Grid.row(c) === Grid.row(cell) || Grid.col(c) === Grid.col(cell),
    );
    line.sort((a, b) => Grid.dist(ctx.playerCell, a) - Grid.dist(ctx.playerCell, b));
    ctx.emit({
      type: 'attack',
      from: ctx.playerCell,
      to: cell,
      ranged: true,
      by: 'player',
      style: 'shot',
    });
    line.forEach((c, i) =>
      ctx.strike(c, ctx.spellDamage(Math.pow(1 - p.params.stepLoss, i)), i === 0),
    );
  }
}
