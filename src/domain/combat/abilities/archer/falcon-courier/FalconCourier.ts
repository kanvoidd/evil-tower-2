import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Сокол-курьер» (hawkeye_p2). */
export class FalconCourier implements IAbility<'falcon_courier'> {
  readonly id = 'falcon_courier';

  apply(ctx: AbilityContext, use: AbilityUse<'falcon_courier'>): void {
    const { cell } = use;
    ctx.take(cell);
    ctx.engine.vacate(cell);
  }
}
