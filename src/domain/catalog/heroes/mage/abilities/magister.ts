import { Ratio } from '../../../../shared';
import { defineAbility } from '../../../abilities/defineAbility';

// Способности, которые открывает «Магистр». Где они стоят — ветка в classes/magister.ts.

/** «Магический щит»: щит на долю максимального здоровья. */
export const magicShield = defineAbility({
  id: 'magic_shield',
  behavior: 'ward',
  params: { shield: Ratio.of(0.35) },
  cost: 4,
  target: 'self',
  cooldown: 4,
});
