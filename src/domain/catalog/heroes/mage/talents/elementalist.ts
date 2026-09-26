import { Ratio, Turns } from '../../../../shared';
import { talent } from '../../../talents/talent';
import { bonus, modify } from '../../../talents/talentEffects';
import { frostSpike, ignite } from '../abilities/elementalist';

// Таланты «Элементалиста». Где они стоят — ветки в classes/elementalist.ts.

/** «Воспламенение»: четыре тика горения на цели — и она взрывается. */
export const ignition = talent(
  'ignition',
  modify(ignite, [
    { burstAt: 4, burstMul: Ratio.of(1), burstSplash: Ratio.of(0.5) },
    { burstAt: 4, burstMul: Ratio.of(1.5), burstSplash: Ratio.of(0.75) },
  ]),
);

/** «Заморозка»: «Ледяной шип» с шансом замораживает цель. */
export const frostbite = talent(
  'frostbite',
  modify(frostSpike, [
    { freeze: Ratio.of(0.25), freezeTurns: Turns.of(1) },
    { freeze: Ratio.of(0.4), freezeTurns: Turns.of(1) },
  ]),
);

/** «Перегрузка»: чем полнее шкала маны, тем сильнее заклинания. */
export const overcharge = talent('overcharge', bonus('overcharge', [20, 40]));
