import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Подкуп». */
export class Bribe implements IAbility<'bribe'> {
  readonly behavior = 'bribe';

  apply(ctx: AbilityContext, use: AbilityUse<'bribe'>): void {
    const { cell, target } = use;
    const e = target!;
    if (ctx.enemies[e.defId].boss) return;
    ctx.emit({ type: 'fx', cells: [cell], style: 'smoke' });
    ctx.emit({ type: 'kill', cell, uid: e.uid });
    ctx.engine.clear(cell);
    ctx.engine.vacate(cell);
  }
}
