import { Grid } from '../../../engine/grid/Grid';
import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Перемешивание поля»: все карты поля, кроме героя, встают на случайные места. */
export class Shuffle implements IAbility<'shuffle'> {
  readonly behavior = 'shuffle';

  apply(ctx: AbilityContext, use: AbilityUse<'shuffle'>): void {
    const cells = Grid.CELLS.filter((c) => c !== ctx.playerCell);
    ctx.emit({ type: 'cast', ability: use.ability.id, cells });
    // тасование Фишера — Йейтса перестановками клеток: каждая видна как обмен двух карт
    for (let i = cells.length - 1; i > 0; i--) {
      const j = ctx.rng.int(0, i);
      if (i !== j) ctx.engine.swap(cells[i], cells[j]);
    }
  }
}
