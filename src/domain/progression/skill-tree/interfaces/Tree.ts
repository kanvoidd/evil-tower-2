import type { ClassId, LineageId } from '../../../catalog';
import type { TreeNode } from './TreeNode';

/** Дерево прокачки линейки: базовый класс, второй, ворота метаморфозы и два финальных. */
export interface Tree {
  id: LineageId;
  base: ClassId;
  second: ClassId;
  terminals: ClassId[];
  nodes: TreeNode[];
  edges: Array<[string, string]>;
  byId: Map<string, TreeNode>;
  classNode: Record<ClassId, TreeNode>;
  evoNode: TreeNode;
}
