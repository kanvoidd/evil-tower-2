import type Phaser from 'phaser';
import type { HubOrigin } from '../../application/hub/interfaces/HubOrigin';
import { UiSound } from '../components';
import { leaveMenu } from './SceneTransitions';

/**
 * Выход из меню в хаб: щелчок, содержимое гаснет, окно сжимается в кнопку меню (`from`).
 * Уход выполняется один раз — повторные нажатия, пока идёт переход, не считаются.
 */
export class MenuExit {
  private leaving = false;

  constructor(private readonly scene: Phaser.Scene, private readonly from: HubOrigin) {}

  /** Переход уже начался. */
  get active(): boolean {
    return this.leaving;
  }

  leave(): void {
    if (this.leaving) return;
    this.leaving = true;
    UiSound.play('click');
    leaveMenu(this.scene, 'Hub', { from: this.from });
  }
}
