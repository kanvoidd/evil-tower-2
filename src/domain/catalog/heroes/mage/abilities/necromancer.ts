import { Ratio, Turns } from '../../../../shared';
import { defineAbility } from '../../../abilities/defineAbility';
import { FULL_BAR } from '../../../abilities/fullBar';

// Способности, которые открывает «Некромант». Где они стоят в дереве — `perks` в classes/necromancer.ts.

/** «Взрыв трупа». */
export const corpseBlast = defineAbility({
  id: 'corpse_blast',
  behavior: 'corpse_blast',
  params: { blast: Ratio.of(0.5) },
  cost: 3,
  target: 'enemy',
  cooldown: 1,
});

/** «Призрачные слуги». */
export const ghosts = defineAbility({
  id: 'ghosts',
  behavior: 'ghosts',
  params: { turns: Turns.of(3), dmg: Ratio.of(0.6), maxGhosts: 2 },
  cost: 3,
  target: 'enemy',
  cooldown: 4,
});

/** «Кукла вуду». */
export const voodoo = defineAbility({
  id: 'voodoo',
  behavior: 'voodoo',
  params: { share: Ratio.of(0.5) },
  cost: 5,
  target: 'enemy',
  cooldown: 2,
});

/** «Жатва мёртвых». */
export const deadHarvest = defineAbility({
  id: 'dead_harvest',
  behavior: 'dead_harvest',
  params: {
    hpShare: Ratio.of(0.5),
    bossHpShare: Ratio.of(0.25),
    cap: Ratio.of(0.9),
    soulBonus: Ratio.of(1),
  },
  cost: FULL_BAR,
  target: 'self',
  once: true,
});
