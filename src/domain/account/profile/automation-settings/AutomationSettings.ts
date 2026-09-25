import type { LineageId } from '../../../catalog';
import type { AutoUseSave } from '../../../combat';
import {
  applyBuy,
  type AutoSkillPlan,
  type AutoSkillSave,
  branchOf,
  costOf,
  DEFAULT_AUTO_SKILL,
  inferBranch,
  planAutoSkill,
  type TreeNode,
  TREES,
} from '../../../progression';
import { ProfilePart } from '../profile-part/ProfilePart';

/** Автоматизация: автоприменение расходников в бою и автопрокачка героя. */
export class AutomationSettings extends ProfilePart {
  get autoUse(): AutoUseSave {
    return this.doc.auto.use;
  }

  setAutoUse(patch: Partial<AutoUseSave>): void {
    this.doc.auto.use = { ...this.doc.auto.use, ...patch };
    this.state.touch();
  }

  autoSkillCfg(l: LineageId = this.parts.heroes.activeLineage): AutoSkillSave {
    return { ...DEFAULT_AUTO_SKILL, ...this.doc.auto.skill[l] };
  }

  setAutoSkill(
    patch: Partial<AutoSkillSave>,
    l: LineageId = this.parts.heroes.activeLineage,
  ): void {
    this.doc.auto.skill[l] = { ...this.autoSkillCfg(l), ...patch };
    this.state.touch();
  }

  /** Включает/выключает автопрокачку одной кнопкой. При включении ветка берётся по последнему улучшению игрока. */
  toggleAutoSkill(): AutoSkillSave {
    const heroes = this.parts.heroes;
    const lin = heroes.activeLineage;
    const on = !this.autoSkillCfg(lin).on;
    const patch: Partial<AutoSkillSave> = { on };
    if (on) Object.assign(patch, inferBranch(TREES[lin], heroes.activeLineageSave) ?? {});
    this.setAutoSkill(patch, lin);
    return this.autoSkillCfg(lin);
  }

  /**
   * Игрок сам купил узел: если автопрокачка включена, запоминаем его ветку (и тип выбора на развилке),
   * чтобы дальше по этой ветке шло автоматически.
   */
  noteManualBuy(n: TreeNode): void {
    const lin = this.parts.heroes.activeLineage;
    if (!this.autoSkillCfg(lin).on) return;
    const patch = branchOf(n);
    if (Object.keys(patch).length) this.setAutoSkill(patch, lin);
  }

  /**
   * Автопрокачка: тратит души на ветку активной линейки — вниз по цепочке, на весь опыт душ. Вызывается при входе
   * в хаб и дерево, после комнаты, при включении и после каждой ручной покупки. Пока игрок не сделал первое
   * улучшение сам, не работает (обучение).
   */
  runAutoSkill(): AutoSkillPlan | null {
    const { heroes, wallets } = this.parts;
    const lin = heroes.activeLineage;
    const cfg = this.autoSkillCfg(lin);
    if (!cfg.on || !this.doc.tutorial.skill) return null;
    const tree = TREES[lin];
    const ls = heroes.activeLineageSave;
    const plan = planAutoSkill(tree, ls, wallets.souls, cfg);
    for (const n of plan.buys) {
      wallets.spendSouls(costOf(ls, n));
      applyBuy(tree, ls, n);
    }
    if (plan.buys.length) this.state.touch();
    return plan;
  }
}
