/** Ежедневная награда сегодня: доступна ли, какой по счёту день цикла и какая серия. */
export interface DailyStatus {
  available: boolean;
  /** День семидневного цикла, с нуля. */
  dayIndex: number;
  streak: number;
}
