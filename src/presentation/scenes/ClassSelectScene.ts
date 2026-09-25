import Phaser from 'phaser';

import { ClassSelectController } from '../../application/class-select/ClassSelectController';
import { ClassSelection } from '../../application/class-select/ClassSelection';
import type { ClassSelectMode } from '../../application/class-select/interfaces/ClassSelectMode';
import { ClassSelectDialogs } from '../dialogs/ClassSelectDialogs';
import { ClassSelectNavigator } from '../navigation/ClassSelectNavigator';
import { ClassSelectView } from '../views/class-select/ClassSelectView';
import type { SceneServices } from './interfaces/SceneServices';

/**
 * Выбор героя: при первом запуске — стартовый герой, из дерева навыков — смена героя.
 * Сцена только собирает вид и связывает его с потоком выбора (`ClassSelectController`).
 */
export class ClassSelectScene extends Phaser.Scene {
  private mode: ClassSelectMode = 'first';
  /** Куда вернуться (ключ сцены). */
  private from = 'Hub';
  private controller?: ClassSelectController;
  private view?: ClassSelectView;

  constructor(private readonly services: SceneServices) {
    super('ClassSelect');
  }

  init(data: { mode?: ClassSelectMode; from?: string } = {}): void {
    this.mode = data.mode ?? 'first';
    this.from = data.from ?? 'Hub';
    this.controller = undefined;
    this.view = undefined;
  }

  create(): void {
    const selection = new ClassSelection(this.services.profile, this.mode);
    this.view = new ClassSelectView(this, {
      selection,
      commands: (cmd) => this.controller?.execute(cmd),
    });
    this.controller = new ClassSelectController({
      selection,
      platform: this.services.platform,
      view: this.view,
      dialogs: new ClassSelectDialogs(this),
      navigator: new ClassSelectNavigator(this, this.from),
    });
    this.controller.start();
  }

  update(): void {
    this.view?.update();
  }
}
