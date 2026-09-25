import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/** «Откат времени» (magister_p3). */
export class Rewind implements IAbility<'rewind'> {
  readonly id = 'rewind';

  apply(ctx: AbilityContext, _use: AbilityUse<'rewind'>): void {
    ctx.restoreSnapshot();
    ctx.emit({ type: 'rewind' });
  }
}
