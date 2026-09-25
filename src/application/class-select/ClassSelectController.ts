import type { ClassId } from '../../domain/catalog';
import type { ClassSelectCommand } from './interfaces/ClassSelectCommand';
import type { ClassSelectControllerDeps } from './interfaces/ClassSelectControllerDeps';

/**
 * Поток выбора героя: команда игрока → операция `ClassSelection` → отклик экрана и переход.
 *
 *   кнопка → ClassSelectCommand → ClassSelectController → ClassSelection → IClassSelectView / навигация
 *
 * В первом запуске выбор сразу ведёт в забег; закрытый герой открывается за золото; смена героя
 * требует подтверждения.
 */
export class ClassSelectController {
  constructor(private readonly d: ClassSelectControllerDeps) {}

  /** Экран готов: платформа узнаёт, что игра загрузилась. */
  start(): void {
    this.d.platform.ready();
  }

  execute(cmd: ClassSelectCommand): void {
    switch (cmd.type) {
      case 'choose':
        void this.choose(cmd.classId);
        return;
      case 'back':
        this.d.navigator.back();
        return;
    }
  }

  private async choose(classId: ClassId): Promise<void> {
    const { selection, view } = this.d;
    const choice = selection.choice(classId);
    if (choice.action === 'start') {
      selection.chooseFirst(classId);
      view.started();
      this.d.navigator.startGame();
      return;
    }
    if (choice.action === 'unlock') {
      if (selection.unlock(choice.lineage)) view.unlocked(classId);
      else view.noGold();
      return;
    }
    if (choice.action === 'current') return;
    if (!(await this.d.dialogs.confirmSwitch(classId))) return;
    selection.switchTo(classId);
    view.switched();
    this.d.navigator.back();
  }
}
