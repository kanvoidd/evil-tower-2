import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Вердикт». */
export class Verdict implements IAbility<'verdict'> {
  readonly behavior = 'verdict';

  apply(ctx: AbilityContext, use: AbilityUse<'verdict'>): void {
    const { ability: p, enemies } = use;
    const limit = ctx.spellDamage(p.params.limit);
    ctx.emit({ type: 'fx', cells: enemies, style: 'holy' });
    for (const c of enemies) {
      const e = ctx.cards[c];
      if (e && !ctx.enemies[e.defId].boss && e.hp <= limit) ctx.killEnemy(c);
    }
  }
}
