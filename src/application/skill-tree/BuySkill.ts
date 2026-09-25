import type { Profile } from '../../domain/logic/profile';
import type { BuyResult, TreeNode } from '../../domain/logic/skillTree';

/**
 * Выучить талант (следующий ранг) или способность за души. Первая такая покупка завершает
 * обучение дерева навыков. Классы покупаются метаморфозой (`Metamorphose`).
 */
export class BuySkill {
  constructor(private readonly profile: Profile) {}

  execute(node: TreeNode): BuyResult {
    const hero = this.profile.activeHero;
    const r = hero.canLearn(node, this.profile.souls);
    if (!r.ok) return r;
    if (!this.profile.spendSouls(r.cost)) return { ok: false, reason: 'souls' };
    hero.learn(node);
    this.profile.markTutorial('skill');
    return r;
  }
}
