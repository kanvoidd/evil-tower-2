import type { ICalendar } from '../../../rewards';
import { Signal } from '../../../shared';
import type { SaveData } from '../../save/interfaces/SaveData';

/**
 * Состояние аккаунта — общее для частей профиля: документ сохранения, время и календарь игрока,
 * сигналы профиля. Правил здесь нет.
 */
export class AccountState {
  /** Изменилось что угодно — документ пора сохранить. */
  readonly changed = new Signal();
  /** Изменился кошелёк активного героя (или сменился сам герой). */
  readonly walletChanged = new Signal();
  /** Открыто достижение (id). */
  readonly achievementUnlocked = new Signal<[string]>();

  constructor(
    public doc: SaveData,
    readonly now: () => number,
    readonly calendar: ICalendar,
  ) {}

  /** Документ изменён — сохранить. */
  touch(): void {
    this.changed.emit();
  }
}
