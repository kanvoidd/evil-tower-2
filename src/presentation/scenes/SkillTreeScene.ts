import Phaser from 'phaser';
import { AutoSkill } from '../../application/skill-tree/AutoSkill';
import { BuySkill } from '../../application/skill-tree/BuySkill';
import { CancelMetamorphosis } from '../../application/skill-tree/CancelMetamorphosis';
import { Metamorphose } from '../../application/skill-tree/Metamorphose';
import { SkillTreeController } from '../../application/skill-tree/SkillTreeController';
import { SkillTreeQuery } from '../../application/skill-tree/SkillTreeQuery';
import { bindAchievementToasts } from '../components';
import { SkillTreeDialogs } from '../dialogs/SkillTreeDialogs';
import { SkillTreeNavigator } from '../navigation/SkillTreeNavigator';
import { PhaserClock } from '../phaser/PhaserClock';
import { SkillTreeView } from '../views/skill-tree/SkillTreeView';
import type { SceneServices } from './interfaces/SceneServices';

/**
 * Дерево навыков. Сцена только координирует: автопрокачка на входе, сборка вида и связка
 * с потоком дерева (`SkillTreeController`); каждый кадр — панорамирование и подсветка.
 */
export class SkillTreeScene extends Phaser.Scene {
  private controller?: SkillTreeController;
  private view?: SkillTreeView;

  constructor(private readonly services: SceneServices) {
    super('SkillTree');
  }

  init(): void {
    this.controller = undefined;
    this.view = undefined;
  }

  create(): void {
    const { profile } = this.services;
    const autoSkill = new AutoSkill(profile);
    // Автопрокачка (если включена) тратит накопленные души до того, как дерево нарисовано.
    const entry = autoSkill.run();
    bindAchievementToasts(this, profile.achievementUnlocked);
    const query = new SkillTreeQuery(profile);
    this.view = new SkillTreeView(this, { query, wallet: profile, commands: (cmd) => this.controller?.execute(cmd) });
    this.controller = new SkillTreeController({
      query,
      buySkill: new BuySkill(profile),
      metamorphose: new Metamorphose(profile),
      cancelMetamorphosis: new CancelMetamorphosis(profile),
      autoSkill,
      view: this.view,
      dialogs: new SkillTreeDialogs(this),
      navigator: new SkillTreeNavigator(this),
      clock: new PhaserClock(this),
    });
    void this.controller.start(entry);
  }

  update(_t: number, dt: number): void {
    this.view?.update(dt);
  }
}
