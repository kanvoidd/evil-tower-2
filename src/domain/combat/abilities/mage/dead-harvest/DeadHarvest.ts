import { Ratio } from '../../../../shared';
import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Жатва мёртвых» (necromancer_legend). */
export class DeadHarvest implements IAbility<'dead_harvest'> {
  readonly id = 'dead_harvest';

  apply(ctx: AbilityContext, use: AbilityUse<'dead_harvest'>): void {
    const { perk: p, enemies } = use;
    ctx.emit({ type: 'fx', cells: enemies, style: 'soul' });
    const bonus = ctx.stats.soulBonus;
    ctx.stats.soulBonus = Ratio.of(bonus + p.params.soulBonus);
    for (const c of enemies) {
      const e = ctx.cards[c];
      if (!e) continue;
      const boss = ctx.enemies[e.defId].boss;
      ctx.damageEnemy(
        c,
        Math.max(
          1,
          Math.round(e.hp * ctx.pp(boss ? p.params.bossHpShare : p.params.hpShare, p.params.cap)),
        ),
        false,
      );
    }
    ctx.stats.soulBonus = bonus;
  }
}
