import type { MenuExit } from '../../../navigation/MenuExit';
import type { IAchievementSource } from './IAchievementSource';

export interface AchievementsViewDeps {
  progress: IAchievementSource;
  exit: MenuExit;
}
