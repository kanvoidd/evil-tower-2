import { Ratio } from '../../../../shared';
import { defineAbility } from '../../../abilities/defineAbility';
import { FULL_BAR } from '../../../abilities/fullBar';

// Способности, которые открывает «Снайпер». Где они стоят в дереве — `perks` в classes/sniper.ts.

/** «Пробивающий выстрел». */
export const railShot = defineAbility({
  id: 'rail_shot',
  behavior: 'rail_shot',
  params: { stepLoss: Ratio.of(0.2) },
  cost: 3,
  target: 'enemy',
});

/** «Бронебойный». */
export const armorPiercing = defineAbility({
  id: 'armor_piercing',
  behavior: 'armor_piercing',
  params: { dmg: Ratio.of(1), hpShare: Ratio.of(0.25), cap: Ratio.of(0.6) },
  cost: 3,
  target: 'enemy',
});

/** «Охотничья метка». */
export const huntersMark = defineAbility({
  id: 'hunters_mark',
  behavior: 'hunters_mark',
  kind: 'passive',
});

/** «Один выстрел — один труп». */
export const oneShot = defineAbility({
  id: 'one_shot',
  behavior: 'one_shot',
  params: { kills: 3, bossHpShare: Ratio.of(0.4), cap: Ratio.of(0.8) },
  cost: FULL_BAR,
  target: 'enemy',
  once: true,
});
