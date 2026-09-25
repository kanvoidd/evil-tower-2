import type { AutoSkillPlan, TreeNode } from '../../../domain/progression';
import type { ClassId } from '../../../domain/types';

/** Дерево навыков на экране — отклик на покупки, метаморфозы и автопрокачку. */
export interface ISkillTreeView {
  /** Купить не вышло: узел закрыт (`state`) или не хватает душ (`souls`). */
  refused(reason: 'state' | 'souls'): void;
  /** Узел куплен (талант, способность или метаморфоза). */
  learned(node: TreeNode): void;
  /** Метаморфоза отменена: герой снова класс `to`. */
  metamorphosisCancelled(to: ClassId): void;
  /** Автопрокачка купила узлы. */
  autoBought(plan: AutoSkillPlan): void;
  /** Автопрокачку включили или выключили; `plan` — что она сразу купила при включении. */
  autoToggled(on: boolean, plan: AutoSkillPlan | null): void;
}
