import { Ratio, Turns } from '../../../../shared';
import { defineAbility } from '../../../abilities/defineAbility';
import { FULL_BAR } from '../../../abilities/fullBar';

// Способности, которые открывает «Тёмный ассасин». Где они стоят в дереве — `perks` в classes/darkassassin.ts.

/** «Клеймо смерти». */
export const deathMark = defineAbility({
  id: 'death_mark',
  behavior: 'death_mark',
  params: { turns: Turns.of(3), bossHpShare: Ratio.of(0.3) },
  cost: 3,
  target: 'enemy',
});

/** «Цепное клеймо». */
export const chainMark = defineAbility({
  id: 'chain_mark',
  behavior: 'chain_mark',
  kind: 'passive',
  params: { turns: Turns.of(3) },
});

/** «Жатва теней». */
export const shadowReap = defineAbility({
  id: 'shadow_reap',
  behavior: 'shadow_reap',
  params: { bossHpShare: Ratio.of(0.3) },
  cost: 5,
  target: 'self',
});

/** «Жнец». */
export const reaper = defineAbility({
  id: 'reaper',
  behavior: 'reaper',
  params: { turns: Turns.of(3) },
  cost: FULL_BAR,
  target: 'self',
  once: true,
});
