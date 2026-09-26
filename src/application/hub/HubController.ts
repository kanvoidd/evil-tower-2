import type { HubCommand } from './interfaces/HubCommand';
import type { HubControllerDeps } from './interfaces/HubControllerDeps';
import type { HubMenu } from './interfaces/HubMenu';
import type { HubOrigin } from './interfaces/HubOrigin';

/**
 * Поток хаба: команды игрока → операции приложения → обновление вида.
 *
 *   кнопка → HubCommand → HubController → награды / навигация → IHubView
 *
 * Уход из хаба (в меню или в бой) выполняется один раз: повторные нажатия, пока играет переход,
 * игнорируются.
 */
export class HubController {
  /** Пауза перед сообщениями входа — пока хаб проявляется. */
  private static readonly INTRO_MS = 700;

  private busy = false;

  constructor(private readonly d: HubControllerDeps) {}

  /**
   * После постройки хаба: при запуске игры и возвращении из боя — ежедневная награда (после
   * первого улучшения, чтобы не перебивать обучение).
   */
  async start(from?: HubOrigin): Promise<void> {
    const { profile } = this.d;
    const greet =
      (!from || from === 'game') && profile.tutorial.skill && profile.dailyStatus().available;
    if (!greet) return;
    await this.d.clock.delay(HubController.INTRO_MS);
    await this.claimDaily();
  }

  execute(cmd: HubCommand): void {
    switch (cmd.type) {
      case 'play':
        this.play();
        return;
      case 'open':
        this.open(cmd.menu);
        return;
      case 'daily':
        void this.claimDaily();
        return;
      case 'gift':
        void this.claimGift();
        return;
    }
  }

  private lock(): boolean {
    if (this.busy) return false;
    this.busy = true;
    return true;
  }

  /** «Играть» — всегда новый забег с комнаты 1-1. */
  private play(): void {
    if (!this.lock()) return;
    if (this.d.profile.tutorial.skill) this.d.profile.markTutorial('hub');
    this.d.navigator.play();
  }

  private open(menu: HubMenu): void {
    if (!this.lock()) return;
    this.d.navigator.open(menu);
  }

  private async claimDaily(): Promise<void> {
    const status = this.d.profile.dailyStatus();
    if (!status.available) return;
    const choice = await this.d.dialogs.daily(status);
    await this.d.daily.execute(choice);
    this.rewarded();
  }

  private async claimGift(): Promise<void> {
    if (!this.d.profile.giftReady()) return;
    const choice = await this.d.dialogs.gift(this.d.profile.nextGift);
    await this.d.gift.execute(choice);
    this.rewarded();
  }

  private rewarded(): void {
    this.d.view.rewarded();
    const s = this.d.state.execute();
    this.d.view.showRewards(s.gift, s.daily);
  }
}
