/** Что показать между комнатами: что принесла эта, сколько здоровья осталось, куда дальше. */
export interface RoomClearSummary {
  gold: number;
  souls: number;
  /** Комната пройдена без единой раны. */
  flawless: boolean;
  hp: number;
  maxHp: number;
  /** Сколько комнат пройдено в забеге, включая эту. */
  rooms: number;
  /** Номер следующей комнаты («2-1»). */
  nextRoomId: string;
}
