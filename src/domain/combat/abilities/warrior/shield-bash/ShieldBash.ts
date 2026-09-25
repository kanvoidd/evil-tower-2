import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Таран щитом». */
export class ShieldBash implements IAbility<'shield_bash'> {
  readonly behavior = 'shield_bash';

  apply(ctx: AbilityContext, use: AbilityUse<'shield_bash'>): void {
    const { ability: p, cell } = use;
    const behind = ctx.behindCell(ctx.playerCell, cell);
    const dmg = ctx.spellDamage(p.params.dmg);
    ctx.emit({ type: 'fx', cells: [cell], style: 'quake' });
    ctx.applyStun(cell, p.params.stun);
    if (behind < 0) {
      // у края поля удар о стену вдвое сильнее
      ctx.damageEnemy(cell, dmg * p.params.wallMul, false);
    } else {
      ctx.damageEnemy(cell, dmg, false);
      if (ctx.cards[behind]?.kind === 'enemy') ctx.damageEnemy(behind, dmg, false);
      if (ctx.cards[cell] && ctx.cards[behind]) ctx.engine.swap(cell, behind);
    }
  }
}
