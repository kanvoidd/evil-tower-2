import type { ICalendar } from '../../domain/rewards';
import { DayKey } from '../../domain/shared';

/** День игрока по местному времени браузера. */
export class LocalCalendar implements ICalendar {
  today(): DayKey {
    const d = new Date();
    return DayKey.of(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }
}
