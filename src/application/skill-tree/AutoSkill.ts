import type { Profile } from '../../domain/account/profile';
import type { AutoSkillPlan } from '../../domain/progression/auto-skill/autoSkill';
import type { TreeNode } from '../../domain/progression/skill-tree/skillTree';
import type { AutoSkillToggle } from './interfaces/AutoSkillToggle';

/**
 * Автопрокачка героя: души уходят в выбранную ветку дерева сами. Работает, только если игрок её
 * включил и уже сделал первое улучшение сам.
 */
export class AutoSkill {
  constructor(private readonly profile: Profile) {}

  get on(): boolean {
    return this.profile.autoSkillCfg().on;
  }

  /** Вложить накопленные души по ветке (null — автопрокачка выключена или обучение не пройдено). */
  run(): AutoSkillPlan | null {
    return this.profile.runAutoSkill();
  }

  /** Включить или выключить. При включении ветка берётся по последнему улучшению, и души вкладываются сразу. */
  toggle(): AutoSkillToggle {
    const { on } = this.profile.toggleAutoSkill();
    return { on, plan: on ? this.profile.runAutoSkill() : null };
  }

  /** Игрок купил узел сам: автопрокачка запоминает его ветку и докупает по ней. */
  afterManualBuy(node: TreeNode): AutoSkillPlan | null {
    if (!this.on) return null;
    this.profile.noteManualBuy(node);
    return this.profile.runAutoSkill();
  }
}
