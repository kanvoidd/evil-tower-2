import type { CellIndex } from '../../../../shared';
import { Grid } from '../../../engine/grid/Grid';
import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/**
 * «Крюк-болт»: дальний враг на линии героя меняется местами с картой между ними и оказывается
 * рядом с героем. «Рывок» бьёт и оглушает притянутого, «Цепной рывок» сдвигает к герою всю линию
 * цели (поперёк выстрела).
 */
export class Hook implements IAbility<'hook'> {
  readonly behavior = 'hook';

  apply(ctx: AbilityContext, use: AbilityUse<'hook'>): void {
    const { ability: a, cell } = use;
    const hero = ctx.playerCell;
    if (!Grid.sameLine(hero, cell) || Grid.dist(hero, cell) !== 2) return;
    const mid = Grid.ray(hero, cell)[0];
    ctx.emit({ type: 'cast', ability: a.id, cells: [cell, mid] });
    const pairs = a.params.chainPull ? Hook.linePairs(cell, mid) : [[cell, mid]];
    for (const [from, to] of pairs) ctx.engine.swap(from, to);
    const p = a.params;
    if (p.pullStun) ctx.applyStun(mid, p.pullStun);
    if (p.pullDmg) ctx.strike(mid, ctx.spellDamage(p.pullDmg), false);
  }

  /**
   * «Цепной рывок»: каждая клетка линии цели (поперёк выстрела) меняется с соседней клеткой ближе
   * к герою. Герой стоит через линию, поэтому его клетку это не задевает.
   */
  private static linePairs(cell: CellIndex, mid: CellIndex): Array<[CellIndex, CellIndex]> {
    const dr = Grid.row(mid) - Grid.row(cell);
    const dc = Grid.col(mid) - Grid.col(cell);
    const across =
      dr === 0
        ? Grid.CELLS.filter((c) => Grid.col(c) === Grid.col(cell))
        : Grid.CELLS.filter((c) => Grid.row(c) === Grid.row(cell));
    return across.map((c): [CellIndex, CellIndex] => [
      c,
      Grid.at(Grid.row(c) + dr, Grid.col(c) + dc),
    ]);
  }
}
