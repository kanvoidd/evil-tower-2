import type { TalentPath } from '../../../catalog';

/**
 * Автопрокачка дерева: одна кнопка (вкл/выкл). Путь (path) не настраивается в окне —
 * он запоминается по последнему таланту, который игрок прокачал сам.
 */
export interface AutoSkillSave {
  on: boolean;
  path: TalentPath;
}
