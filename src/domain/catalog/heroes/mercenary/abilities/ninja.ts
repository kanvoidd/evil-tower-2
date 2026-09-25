import { Ratio, Turns } from '../../../../shared';
import { defineAbility } from '../../../abilities/defineAbility';
import { FULL_BAR } from '../../../abilities/fullBar';

// Способности, которые открывает «Ниндзя». Где они стоят в дереве — `perks` в classes/ninja.ts.

/** «Веер сюрикенов». */
export const shurikenFan = defineAbility({
  id: 'shuriken_fan',
  behavior: 'shuriken_fan',
  params: { targets: 4, dmg: Ratio.of(0.6) },
  cost: 3,
  target: 'self',
});

/** «Подмена». */
export const substitution = defineAbility({
  id: 'substitution',
  behavior: 'substitution',
  kind: 'passive',
});

/** «Дымовая завеса». */
export const smokeScreen = defineAbility({
  id: 'smoke_screen',
  behavior: 'smoke_screen',
  params: { turns: Turns.of(2) },
  cost: 4,
  target: 'self',
});

/** «Тень ветра». */
export const windShadow = defineAbility({
  id: 'wind_shadow',
  behavior: 'wind_shadow',
  params: { dmg: Ratio.of(0.8) },
  cost: FULL_BAR,
  target: 'self',
  once: true,
});
