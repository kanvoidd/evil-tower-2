import type { IAttackAnimation } from '../interfaces/IAttackAnimation';
import type { BackstabAnimation } from './BackstabAnimation';
import type { MeleeAttackAnimation } from './MeleeAttackAnimation';
import type { RangedAttackAnimation } from './RangedAttackAnimation';

/**
 * Узел «Атака» дерева анимаций: рука, выстрел, молния, удар в спину. Какую показать, решает
 * стиль события `attack` — его выставляет правило боя по стратегии атаки линейки, поэтому
 * отдельных «анимаций мага» или «анимаций лучника» нет.
 */
export class AttackAnimations {
  constructor(
    readonly melee: MeleeAttackAnimation,
    private readonly shot: RangedAttackAnimation,
    private readonly bolt: RangedAttackAnimation,
    private readonly backstab: BackstabAnimation,
  ) {}

  /** Анимация удара героя или врага: `ranged` бывает только у героя. */
  pick(ranged: boolean, style?: 'shot' | 'backstab' | 'bolt'): IAttackAnimation {
    if (!ranged) return this.melee;
    if (style === 'backstab') return this.backstab;
    return style === 'bolt' ? this.bolt : this.shot;
  }
}
