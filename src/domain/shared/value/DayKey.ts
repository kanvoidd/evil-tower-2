/**
 * Календарный день «ГГГГ-ММ-ДД» — без времени и часового пояса. В сохранении это та же строка,
 * поэтому дни сравниваются как строки, а разница дней считается по календарю.
 */
export type DayKey = string & { readonly __unit: 'day' };

/** Сутки в миллисекундах — шаг между соседними днями по UTC. */
const DAY_MS = 86_400_000;

export const DayKey = {
  /** День по календарю: год, месяц (1–12), число. */
  of: (year: number, month: number, day: number): DayKey =>
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` as DayKey,
  /** Полночь дня по UTC: разница двух таких моментов — ровно целое число суток. */
  utcMidnight: (k: string): number => {
    const [y, m, d] = k.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  },
  /** Сколько дней от `a` до `b` по календарю; у испорченной строки — `NaN`. */
  daysBetween: (a: string, b: string): number =>
    (DayKey.utcMidnight(b) - DayKey.utcMidnight(a)) / DAY_MS,
};
