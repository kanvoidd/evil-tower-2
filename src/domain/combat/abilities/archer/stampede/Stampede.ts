import type { AbilityDefOf } from '../../../../catalog';
import type { CellIndex } from '../../../../shared';
import { Grid } from '../../../engine/grid/Grid';
import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/**
 * «Стадо кабанов»: кабаны вбегают с края поля и пробегают строку или столбец — оглушают врагов, а
 * кучки золота на пути сминают до одной монеты. Героя не задевают. Сначала бежать можно только по
 * линии героя, на втором уровне — по любой; «Перекрёстная пробежка» — крестом через клетку.
 */
export class Stampede implements IAbility<'stampede'> {
  readonly behavior = 'stampede';

  apply(ctx: AbilityContext, use: AbilityUse<'stampede'>): void {
    const { ability: a, cell } = use;
    const cells = Stampede.path(ctx, a, cell).filter((c) => c !== ctx.playerCell);
    ctx.emit({ type: 'cast', ability: a.id, cells });
    for (const c of cells) {
      const card = ctx.cards[c];
      if (card?.kind === 'enemy') ctx.applyStun(c, a.params.stun);
      else if (card?.kind === 'gold' && card.value > 1) {
        card.value = 1;
        ctx.emit({ type: 'value', cell: c, uid: card.uid, value: card.value });
      }
    }
  }

  /** Без второго уровня — только клетки на линии героя. */
  targetOk(ctx: AbilityContext, ability: AbilityDefOf<'stampede'>, cell: CellIndex): boolean {
    return !!ability.params.anyLine || Grid.sameLine(ctx.playerCell, cell);
  }

  /**
   * Клетки пробежки: крестом — строка и столбец клетки; иначе линия, которую клетка делит с
   * героем, а если не делит — та из её строки и столбца, где больше врагов (при равенстве строка).
   */
  private static path(
    ctx: AbilityContext,
    a: AbilityDefOf<'stampede'>,
    cell: CellIndex,
  ): CellIndex[] {
    const row = Grid.CELLS.filter((c) => Grid.row(c) === Grid.row(cell));
    const col = Grid.CELLS.filter((c) => Grid.col(c) === Grid.col(cell));
    if (a.params.cross) return [...new Set([...row, ...col])];
    const hero = ctx.playerCell;
    if (Grid.row(hero) === Grid.row(cell)) return row;
    if (Grid.col(hero) === Grid.col(cell)) return col;
    const foes = (cells: CellIndex[]): number =>
      cells.filter((c) => ctx.cards[c]?.kind === 'enemy').length;
    return foes(col) > foes(row) ? col : row;
  }
}
