import type { BranchStep } from './BranchStep';

/**
 * Ветка профессионального развития класса («Огонь» элементалиста, «Урон» арканиста): перки и
 * таланты по порядку, каждый следующий шаг открывается после предыдущего.
 */
export interface BranchDef {
  /** Id ветки внутри класса (`fire`) — часть места её шагов в дереве и в сохранении. */
  readonly id: string;
  readonly steps: readonly BranchStep[];
}
