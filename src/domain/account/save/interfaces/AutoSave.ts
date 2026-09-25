import type { LineageId } from '../../../catalog';
import type { AutoUseSave } from '../../../combat';
import type { AutoSkillSave } from '../../../progression';

export interface AutoSave {
  use: AutoUseSave;
  skill: Partial<Record<LineageId, AutoSkillSave>>;
}
