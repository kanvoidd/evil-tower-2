import type { AbilityDefOf } from '../../../../catalog';
import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/**
 * Защита на себя — «Магический щит» и «Ледяной доспех»: щит на долю максимального здоровья, а у
 * доспеха ещё прибавка к защите и ответный удар по каждому, кто бьёт героя, на несколько ходов.
 */
export class Ward implements IAbility<'ward'> {
  readonly behavior = 'ward';

  apply(ctx: AbilityContext, use: AbilityUse<'ward'>): void {
    const p = use.ability.params;
    ctx.addShield(Math.max(1, Math.round(ctx.stats.maxHp * ctx.pp(p.shield))));
    if (p.turns) ctx.setWard(p.defense ?? 0, p.thorns ?? 0, p.turns);
  }

  /** Доспех на время не надеть второй раз, пока держится прежний; щит без срока — можно. */
  active(ctx: AbilityContext, ability: AbilityDefOf<'ward'>): boolean {
    return !!ability.params.turns && ctx.wardActive;
  }
}
