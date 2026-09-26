import type { TreeNode } from '../../../domain/progression';

/** Что игрок сделал в дереве навыков. Выбор узла — дело экрана, команд не требует. */
export type SkillTreeCommand =
  /** Купить талант, способность или метаморфозу (узел-класс). */
  | { type: 'buy'; node: TreeNode }
  /** Отказаться от класса, выбранного из нескольких. */
  | { type: 'cancel-metamorphosis' }
  /** Сменить героя (линейку). */
  | { type: 'switch-class' }
  | { type: 'close' };
