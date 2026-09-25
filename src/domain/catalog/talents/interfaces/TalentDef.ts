import type { ClassId } from '../../classes/interfaces/ClassId';
import type { TalentFx } from './TalentFx';
import type { TalentPath } from './TalentPath';

export interface TalentDef {
  /** `warrior/a1-2` — класс, путь (a/v/g), ярус и место в цепочке. */
  id: string;
  classId: ClassId;
  path: TalentPath;
  tier: 1 | 2 | 3;
  /** Место в цепочке яруса, начиная с нуля. */
  step: number;
  fx: TalentFx;
  /** Суммарное значение эффекта на каждом ранге. Длина массива = число рангов. */
  v: number[];
  /** Второе значение ранга для эффектов из пары «шанс / сила» (например, раздвоение молнии). */
  v2?: number[];
}
