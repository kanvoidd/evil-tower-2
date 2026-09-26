import { Ratio } from '../../../../shared';
import { talent } from '../../../talents/talent';
import { modify } from '../../../talents/talentEffects';
import { blightShot } from '../abilities/warlock';

// Таланты «Чернокнижника». Где они стоят — ветка в classes/warlock.ts.

/** «Распространение»: взрыв заражённого с шансом заражает соседей. */
export const plagueSpread = talent(
  'plague_spread',
  modify(blightShot, [{ spread: Ratio.of(0.3) }, { spread: Ratio.of(0.5) }]),
);
