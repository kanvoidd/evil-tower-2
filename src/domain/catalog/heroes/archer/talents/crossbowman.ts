import { Ratio, Turns } from '../../../../shared';
import { talent } from '../../../talents/talent';
import { modify } from '../../../talents/talentEffects';
import { boltVolley, hookBolt } from '../abilities/crossbowman';

// Таланты «Арбалетчика». Где они стоят — ветка в classes/crossbowman.ts.

/** «Пробивающий выстрел»: болт бьёт и второго врага на линии, вполсилы. */
export const piercingBolt = talent(
  'piercing_bolt',
  modify(boltVolley, [{ pierce: 2, stepLoss: Ratio.of(0.5) }]),
);

/** «Рывок»: притянутый враг получает удар и оглушение. */
export const yank = talent(
  'yank',
  modify(hookBolt, [{ pullDmg: Ratio.of(0.8), pullStun: Turns.of(1) }]),
);

/** «Цепной рывок»: к герою сдвигается вся линия цели. */
export const chainYank = talent('chain_yank', modify(hookBolt, [{ chainPull: 1 }]));
