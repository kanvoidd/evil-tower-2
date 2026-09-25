import { Grid } from '../../../engine/grid/Grid';
import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Один выстрел — один труп». */
export class OneShot implements IAbility<'one_shot'> {
  readonly behavior = 'one_shot';

  apply(ctx: AbilityContext, use: AbilityUse<'one_shot'>): void {
    const { ability: p, cell, enemies } = use;
    ctx.emit({ type: 'fx', cells: [cell], style: 'beam' });
    const line = [
      cell,
      ...enemies.filter(
        (c) => c !== cell && (Grid.row(c) === Grid.row(cell) || Grid.col(c) === Grid.col(cell)),
      ),
    ];
    let kills = 0;
    for (const c of line) {
      const e = ctx.cards[c];
      if (!e) continue;
      if (ctx.enemies[e.defId].boss) {
        const share = ctx.pp(p.params.bossHpShare, p.params.cap);
        ctx.damageEnemy(c, Math.max(1, Math.round(e.maxHp * share)), true);
      } else if (kills < p.params.kills) {
        ctx.killEnemy(c);
        kills++;
      }
    }
  }
}
