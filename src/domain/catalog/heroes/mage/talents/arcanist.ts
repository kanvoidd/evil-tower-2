import { Ratio } from '../../../../shared';
import { talent } from '../../../talents/talent';
import { modify } from '../../../talents/talentEffects';
import { magicShot } from '../abilities/arcanist';

// Таланты «Арканиста». Где они стоят — ветки в classes/arcanist.ts.

/** «Заряд»: пока выстрел готов и ждёт, он копит силу. */
export const arcaneCharge = talent(
  'arcane_charge',
  modify(magicShot, [
    { chargePer: Ratio.of(0.25), chargeMax: 3 },
    { chargePer: Ratio.of(0.4), chargeMax: 3 },
  ]),
);
