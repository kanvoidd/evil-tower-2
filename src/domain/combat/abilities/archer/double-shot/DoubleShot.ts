import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Двойной выстрел». */
export class DoubleShot implements IAbility<'double_shot'> {
  readonly behavior = 'double_shot';

  apply(ctx: AbilityContext, use: AbilityUse<'double_shot'>): void {
    const { ability: p, cell, target } = use;
    ctx.emit({
      type: 'attack',
      from: ctx.playerCell,
      to: cell,
      ranged: true,
      by: 'player',
      style: 'shot',
    });
    const killed = ctx.strike(cell, ctx.spellDamage(p.params.dmg), ctx.rollCrit(target, true));
    let second = cell;
    if (killed) {
      second = ctx.nearestEnemy(ctx.playerCell);
      if (second < 0) return;
    }
    ctx.strike(second, ctx.spellDamage(p.params.dmg), ctx.rollCrit(ctx.cards[second], true));
  }
}
