import { isHolyTarget } from '../../../../catalog';
import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Гнев небес». */
export class HeavensWrath implements IAbility<'heavens_wrath'> {
  readonly behavior = 'heavens_wrath';

  apply(ctx: AbilityContext, use: AbilityUse<'heavens_wrath'>): void {
    const { ability: p, enemies } = use;
    ctx.emit({ type: 'fx', cells: enemies, style: 'holy' });
    for (const c of enemies) {
      const e = ctx.cards[c];
      if (!e) continue;
      const holy = isHolyTarget(ctx.enemies[e.defId].tag);
      ctx.applyStun(c, p.params.stun);
      ctx.damageEnemy(c, ctx.spellDamage(holy ? p.params.holyDmg : p.params.dmg), false);
    }
  }
}
