import { Ratio } from '../../../../shared';
import { defineAbility } from '../../../abilities/defineAbility';

// Способности, которые открывает «Арканист». Где они стоят — ветки в classes/arcanist.ts.

// ---- урон

/** «Магический выстрел»: бьёт ближайшего врага на линии, на втором уровне — пробивает линию. */
export const magicShot = defineAbility({
  id: 'magic_shot',
  behavior: 'ray',
  levels: [
    { dmg: Ratio.of(1.5), pierce: 1, stepLoss: Ratio.of(0.3) },
    { dmg: Ratio.of(1.5), pierce: 2, stepLoss: Ratio.of(0.3) },
  ],
  cost: 4,
  target: 'ray',
  cooldown: 1,
});

// ---- манипуляция

/** «Точечная перестановка»: две любые карты меняются местами. */
export const swap = defineAbility({
  id: 'swap',
  behavior: 'swap',
  cost: 2,
  target: 'two',
  cooldown: 5,
});

/** «Перемешивание поля»: все карты поля, кроме героя, встают по-новому. */
export const shuffle = defineAbility({
  id: 'shuffle',
  behavior: 'shuffle',
  cost: 3,
  target: 'self',
  cooldown: 4,
});
