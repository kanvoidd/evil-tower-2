import Phaser from 'phaser';

import { bindAchievementToasts } from '../components';
import { MenuExit } from '../navigation/MenuExit';
import { AchievementsView } from '../views/achievements/AchievementsView';
import type { SceneServices } from './interfaces/SceneServices';

/** Список достижений. Операций нет — только вид и выход в хаб. */
export class AchievementsScene extends Phaser.Scene {
  constructor(private readonly services: SceneServices) {
    super('Achievements');
  }

  create(): void {
    const { profile } = this.services;
    bindAchievementToasts(this, profile.achievementUnlocked);
    new AchievementsView(this, { progress: profile, exit: new MenuExit(this, 'achievements') });
  }
}
