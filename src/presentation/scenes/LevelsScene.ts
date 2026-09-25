import Phaser from 'phaser';
import { bindAchievementToasts } from '../components';
import { MenuExit } from '../navigation/MenuExit';
import { LevelsView } from '../views/levels/LevelsView';
import type { SceneServices } from './interfaces/SceneServices';

/** Карта рекорда героя. Операций нет — только вид и выход в хаб. */
export class LevelsScene extends Phaser.Scene {
  constructor(private readonly services: SceneServices) {
    super('Levels');
  }

  create(): void {
    const { profile } = this.services;
    bindAchievementToasts(this, profile.achievementUnlocked);
    new LevelsView(this, { record: profile, exit: new MenuExit(this, 'levels') });
  }
}
