import type { AbilityContext } from '../../interfaces/AbilityContext';
import type { AbilityUse } from '../../interfaces/AbilityUse';
import type { IAbility } from '../../interfaces/IAbility';

/**
 * «Капкан»: ловушка на клетке. Враг, который окажется на ней (новая карта из колоды, сдвиг,
 * перестановка или уже стоящий там), получает урон и оглушение — это делает бой (`RoomTraps`).
 */
export class Trap implements IAbility<'trap'> {
  readonly behavior = 'trap';

  apply(ctx: AbilityContext, use: AbilityUse<'trap'>): void {
    ctx.placeSnare(use.cell, use.ability);
  }
}
