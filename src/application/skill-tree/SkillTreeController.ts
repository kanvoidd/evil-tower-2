import { CLASSES } from '../../domain/catalog';
import type { TreeNode } from '../../domain/progression';
import { ProgressionBalance } from '../../domain/progression';
import type { SkillTreeCommand } from './interfaces/SkillTreeCommand';
import type { SkillTreeControllerDeps } from './interfaces/SkillTreeControllerDeps';

/**
 * Поток дерева навыков: команда игрока → операция приложения → отклик экрана.
 *
 *   кнопка → SkillTreeCommand → SkillTreeController → BuySkill / Metamorphose / CancelMetamorphosis
 *                                                    → ISkillTreeView
 *
 * Метаморфоза и отказ от класса требуют подтверждения.
 */
export class SkillTreeController {
  private closing = false;

  constructor(private readonly d: SkillTreeControllerDeps) {}

  execute(cmd: SkillTreeCommand): void {
    switch (cmd.type) {
      case 'buy':
        void this.buy(cmd.node);
        return;
      case 'cancel-metamorphosis':
        void this.cancelMetamorphosis();
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
      if (!(await this.d.dialogs.confirmMetamorphosis(this.d.query.activeClass, to))) return;
      if (!this.d.metamorphose.execute(to).ok) return;
    } else if (!this.d.buySkill.execute(node).ok) {
      return;
    }
    this.d.view.learned(node);
  }

  private async cancelMetamorphosis(): Promise<void> {
    const from = this.d.query.activeClass;
    const to = CLASSES[from].parents[0];
    const pct = Math.round(ProgressionBalance.cancelMetamorphosisRefund * 100);
    if (!(await this.d.dialogs.confirmCancel(from, to, pct))) return;
    this.d.view.metamorphosisCancelled(this.d.cancelMetamorphosis.execute().to);
  }

  private close(): void {
    if (this.closing) return;
    this.closing = true;
    this.d.navigator.close();
  }
}
