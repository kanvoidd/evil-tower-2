import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Жребий колоды». */
export class DeckDraw implements IAbility<'deck_draw'> {
  readonly behavior = 'deck_draw';

  apply(ctx: AbilityContext, use: AbilityUse<'deck_draw'>): void {
    const { cell } = use;
    const c = ctx.cards[cell];
    if (!c) return;
    if (c.kind === 'enemy' && ctx.enemies[c.defId].boss) return;
    ctx.emit({ type: 'fx', cells: [cell], style: 'arcane' });
    ctx.engine.discard(cell);
    ctx.engine.deck.push(c);
    const next = ctx.engine.draw();
    if (next) ctx.engine.put(cell, next);
    else ctx.engine.vacate(cell);
  }
}
