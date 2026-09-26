import type { ClassId, PerkSlot, TalentPath, TalentTab, TalentTierNumber } from '../../../catalog';
import type { NodeKind } from './NodeKind';

/**
 * Узел дерева прокачки. Координат на экране у узла нет — их считает раскладка вида; правилам
 * нужен только уровень `row`: чем он меньше, тем выше узел в дереве, у узлов на одной высоте
 * он одинаков (так автопрокачка идёт сверху вниз). Уровни считаются на каждой вкладке отдельно.
 */
export interface TreeNode {
  id: string;
  kind: NodeKind;
  /** Вкладка: «Основа» (общие таланты) или «Профессия» (классы). */
  tab: TalentTab;
  row: number;
  /** Класс, которому принадлежит узел (у узла-класса — он сам, у «Основы» — базовый класс). */
  owner: ClassId;
  parents: string[];
  /** Сколько рангов у узла: у таланта — его ранги, у перка — уровни (по умолчанию один). */
  ranks?: number;
  // talent
  talentId?: string;
  path?: TalentPath;
  tier?: TalentTierNumber;
  /** Место в цепочке яруса или номер шага в ветке. */
  step?: number;
  // perk
  slot?: PerkSlot;
  // talent и perk в ветке класса
  branch?: string;
  // class
  classId?: ClassId;
}
