import type Phaser from 'phaser';
import type { ISkillTreeNavigator } from '../../application/skill-tree/interfaces/ISkillTreeNavigator';
import { MenuExit } from './MenuExit';
import { fadeToScene } from './SceneTransitions';

/** Из дерева навыков: обратно в хаб (окно сжимается в карточку героя) или к выбору героя. */
export class SkillTreeNavigator implements ISkillTreeNavigator {
  private readonly exit: MenuExit;

  constructor(private readonly scene: Phaser.Scene) {
    this.exit = new MenuExit(scene, 'skill');
  }

  close(): void {
    this.exit.leave();
  }

  switchClass(): void {
    fadeToScene(this.scene, 'ClassSelect', { mode: 'switch', from: 'SkillTree' });
  }
}
