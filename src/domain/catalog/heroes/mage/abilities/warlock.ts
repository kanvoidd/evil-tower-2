import { Ratio, Turns } from '../../../../shared';
import { defineAbility } from '../../../abilities/defineAbility';

// Способности, которые открывает «Чернокнижник». Где они стоят — ветка в classes/warlock.ts.

/** «Выстрел скверны»: урон и заражение — умирая, цель взрывается. */
export const blightShot = defineAbility({
  id: 'blight_shot',
  behavior: 'strike',
  params: { dmg: Ratio.of(0.8), infect: Ratio.of(0.5) },
  cost: 3,
  target: 'enemy',
  cooldown: 1,
});

/** «Мёртвый слуга»: на месте заражённого встаёт его мёртвая версия. */
export const deadServant = defineAbility({
  id: 'dead_servant',
  behavior: 'dead_servant',
  kind: 'passive',
  params: { hp: Ratio.of(0.5), dmg: Ratio.of(0.5), turns: Turns.of(2) },
});
