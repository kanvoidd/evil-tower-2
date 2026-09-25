import type { ClassId, PerkSlot, TalentPath } from '../../../catalog';
import type { NodeKind } from './NodeKind';

/**
 * Узел дерева прокачки. Координат на экране у узла нет — их считает раскладка вида; правилам
 * нужен только уровень `row`: чем он меньше, тем выше узел в дереве, у узлов на одной высоте
 * он одинаков (так автопрокачка идёт сверху вниз).
 */
export interface TreeNode {
  id: string;
  kind: NodeKind;
  row: number;
  /** Класс, которому принадлежит узел (у узла-класса — он сам). */
  owner: ClassId;
  parents: string[];
  // talent
  talentId?: string;
  path?: TalentPath;
  tier?: 1 | 2 | 3;
  /** Место в цепочке яруса. */
  step?: number;
  ranks?: number;
  // perk
  slot?: PerkSlot;
  // class
  classId?: ClassId;
}
