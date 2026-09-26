import type { ClassId, LineageId } from '../../../catalog';
import type { TreeNode } from './TreeNode';

/** Общее у любого дерева прокачки линейки: узлы, связи, узлы классов. */
interface TreeCommon {
  id: LineageId;
  /** Базовый класс — с него начинает новый герой. */
  base: ClassId;
  nodes: TreeNode[];
  edges: Array<[string, string]>;
  byId: Map<string, TreeNode>;
  classNode: Record<ClassId, TreeNode>;
}

/** Дерево с ярусами (воин, наёмник): базовый класс, второй, ворота метаморфозы и два финальных. */
export interface TieredTree extends TreeCommon {
  shape: 'tiered';
  second: ClassId;
  terminals: ClassId[];
  evoNode: TreeNode;
}

/**
 * Дерево с ветками (маг, охотник): вкладка «Основа» — общие таланты, вкладка «Профессия» —
 * базовый класс, подклассы на выбор со своими ветками и переходный класс, в который ведёт любой.
 */
export interface BranchedTree extends TreeCommon {
  shape: 'branched';
  subclasses: ClassId[];
  transitional: ClassId[];
}

export type Tree = TieredTree | BranchedTree;
