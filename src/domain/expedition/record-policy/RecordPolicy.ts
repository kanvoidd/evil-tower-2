import type { RunCarry } from '../interfaces/RunCarry';

/**
 * Рекорд героя — сколько комнат подряд он прошёл за один забег. Пишется сразу после каждой
 * пройденной комнаты: закрытая посреди забега вкладка его не отнимает.
 */
export class RecordPolicy {
  /** Сколько комнат записать в рекорд прямо сейчас (профиль оставит большее из двух). */
  static climb(carry: RunCarry): number {
    return carry.rooms;
  }

  /** Забег побил рекорд, который был у героя до его начала. */
  static isRecord(carry: RunCarry): boolean {
    return carry.rooms > carry.best;
  }
}
