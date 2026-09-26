import type { ClassId } from '../../../domain/catalog';
import type { TreeNode } from '../../../domain/progression';

/** Дерево навыков на экране — отклик на покупки и метаморфозы. */
export interface ISkillTreeView {
  /** Купить не вышло: узел закрыт (`state`) или не хватает душ (`souls`). */
  refused(reason: 'state' | 'souls'): void;
  /** Узел куплен (талант, способность или метаморфоза). */
  learned(node: TreeNode): void;
  /** Метаморфоза отменена: герой снова класс `to`. */
  metamorphosisCancelled(to: ClassId): void;
}
