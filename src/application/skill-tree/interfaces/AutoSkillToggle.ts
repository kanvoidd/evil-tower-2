import type { AutoSkillPlan } from '../../../domain/progression';

/** Итог переключения автопрокачки: включена ли и что она сразу купила. */
export interface AutoSkillToggle {
  on: boolean;
  plan: AutoSkillPlan | null;
}
