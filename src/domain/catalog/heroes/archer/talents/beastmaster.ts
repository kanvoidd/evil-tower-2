import { talent } from '../../../talents/talent';
import { chanceAndPower, modify } from '../../../talents/talentEffects';
import { stampede } from '../abilities/beastmaster';

// Таланты «Мастера зверей». Где они стоят — ветка в classes/beastmaster.ts.

/** «Перекрёстная пробежка»: кабаны бегут крестом — по строке и столбцу выбранной клетки. */
export const crossingRun = talent('crossing_run', modify(stampede, [{ cross: 1 }]));

/** «Поддержка с воздуха»: после базовой атаки сокол с шансом бьёт ту же цель. */
export const airSupport = talent(
  'air_support',
  chanceAndPower('basicEcho', { chance: [25], power: [60] }),
);
