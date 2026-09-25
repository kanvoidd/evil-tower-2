/** Рекорд героя для плашки хаба: докуда удалось дойти за один забег. */
export interface HubRecord {
  /** Сколько комнат пройдено за лучший забег. */
  cleared: number;
  total: number;
  floors: number;
  /** Самая высокая пройденная комната (или 1-1, если рекорда нет) и её этаж. */
  roomId: string;
  floor: number;
}
