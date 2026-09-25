import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Бронебойный». */
export class ArmorPiercing implements IAbility<'armor_piercing'> {
  readonly behavior = 'armor_piercing';

  apply(ctx: AbilityContext, use: AbilityUse<'armor_piercing'>): void {
    const { ability: p, cell, target } = use;
    const e = target!;
    ctx.emit({
      type: 'attack',
      from: ctx.playerCell,
      to: cell,
      ranged: true,
      by: 'player',
      style: 'shot',
    });
    const bonus = Math.round(e.maxHp * ctx.pp(p.params.hpShare, p.params.cap));
    ctx.strike(cell, ctx.spellDamage(p.params.dmg) + bonus, ctx.rollCrit(e, true));
  }
}
