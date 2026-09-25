import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Мощный удар». */
export class PowerStrike implements IAbility<'power_strike'> {
  readonly behavior = 'power_strike';

  apply(ctx: AbilityContext, use: AbilityUse<'power_strike'>): void {
    const { ability: p, cell, target } = use;
    const enemy = target!;
    let dmg = ctx.spellDamage(p.params.dmg);
    const crit = ctx.rollCrit(enemy, false);
    if (crit) dmg = Math.max(dmg + 1, Math.round(dmg * ctx.rollCritMul()));
    ctx.emit({ type: 'attack', from: ctx.playerCell, to: cell, ranged: false, by: 'player' });
    const before = enemy.hp;
    const killed = ctx.strike(cell, dmg, crit);
    // излишек проламывает цель и бьёт врага за ней по той же линии
    const over = dmg - before;
    if (killed && over > 0) {
      const behind = ctx.behindCell(ctx.playerCell, cell);
      if (behind >= 0 && ctx.cards[behind]?.kind === 'enemy') ctx.damageEnemy(behind, over, false);
    }
    if (killed) ctx.stepInto(cell);
  }
}
