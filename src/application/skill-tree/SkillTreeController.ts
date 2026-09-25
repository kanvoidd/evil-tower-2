import { CLASSES } from '../../domain/catalog';
import type { AutoSkillPlan, TreeNode } from '../../domain/progression';
import { ProgressionBalance } from '../../domain/progression';
import type { SkillTreeCommand } from './interfaces/SkillTreeCommand';
import type { SkillTreeControllerDeps } from './interfaces/SkillTreeControllerDeps';

/**
 * Поток дерева навыков: команда игрока → операция приложения → отклик экрана.
 *
 *   кнопка → SkillTreeCommand → SkillTreeController → BuySkill / Metamorphose / CancelMetamorphosis / AutoSkill
 *                                                    → ISkillTreeView
 *
 * Метаморфоза и отказ от класса требуют подтверждения; после ручной покупки автопрокачка
 * (если включена) докупает по той же ветке.
 */
export class SkillTreeController {
  /** Пауза перед итогом автопрокачки при входе — пока дерево проявляется. */
  private static readonly INTRO_MS = 650;

  private closing = false;

  constructor(private readonly d: SkillTreeControllerDeps) {}

  /** После постройки дерева: что успела купить автопрокачка на входе. */
  async start(entry: AutoSkillPlan | null): Promise<void> {
    if (!entry?.buys.length) return;
    await this.d.clock.delay(SkillTreeController.INTRO_MS);
    this.d.view.autoBought(entry);
  }

  execute(cmd: SkillTreeCommand): void {
    switch (cmd.type) {
      case 'buy':
        void this.buy(cmd.node);
        return;
      case 'cancel-metamorphosis':
        void this.cancelMetamorphosis();
        return;
      case 'toggle-auto':
        this.toggleAuto();
        return;
      case 'switch-class':
        this.d.navigator.switchClass();
        return;
      case 'close':
        this.close();
        return;
    }
  }

  private async buy(node: TreeNode): Promise<void> {
    const check = this.d.query.check(node);
    if (!check.ok) {
      this.d.view.refused(check.reason);
      return;
    }
    if (node.kind === 'class') {
      const to = node.classId!;
      if (!(await this.d.dialogs.confirmMetamorphosis(CLASSES[to].parent!, to))) return;
      if (!this.d.metamorphose.execute(to).ok) return;
    } else if (!this.d.buySkill.execute(node).ok) {
      return;
    }
    this.d.view.learned(node);
    const plan = this.d.autoSkill.afterManualBuy(node);
    if (plan?.buys.length) this.d.view.autoBought(plan);
  }

  private async cancelMetamorphosis(): Promise<void> {
    const from = this.d.query.activeClass;
    const to = CLASSES[from].parent!;
    const pct = Math.round(ProgressionBalance.cancelMetamorphosisRefund * 100);
    if (!(await this.d.dialogs.confirmCancel(from, to, pct))) return;
    this.d.view.metamorphosisCancelled(this.d.cancelMetamorphosis.execute().to);
  }

  private toggleAuto(): void {
    const { on, plan } = this.d.autoSkill.toggle();
    this.d.view.autoToggled(on, plan);
  }

  private close(): void {
    if (this.closing) return;
    this.closing = true;
    this.d.navigator.close();
  }
}
