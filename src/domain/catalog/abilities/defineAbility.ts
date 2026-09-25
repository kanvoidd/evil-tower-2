import type { AbilityBehaviorId } from './interfaces/AbilityBehaviorId';
import type { AbilityBehaviorParams } from './interfaces/AbilityBehaviorParams';
import type { AbilityDefOf } from './interfaces/AbilityDef';
import type { AbilitySpecOf } from './interfaces/AbilitySpec';

/**
 * Определение способности: механика выводится из записи, и компилятор проверяет, что числа
 * подходят ей. Способности лежат в `heroes/<линейка>/abilities/<класс>.ts` — файл на класс,
 * который их открывает.
 */
export const defineAbility = <B extends AbilityBehaviorId>(
  s: AbilitySpecOf<B>,
): AbilityDefOf<B> => ({
  id: s.id,
  behavior: s.behavior,
  kind: s.kind ?? 'button',
  params: (s.params ?? {}) as AbilityBehaviorParams[B],
  cost: s.cost,
  goldCost: s.goldCost,
  target: s.target,
  once: s.once,
  cooldown: s.cooldown,
});
