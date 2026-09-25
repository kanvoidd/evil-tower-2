/** Счётчики игрока за всё время — по ним растут достижения. */
export interface PlayerCounters {
  kills: number;
  goldEarned: number;
  soulsEarned: number;
  roomsCleared: number;
  deaths: number;
  chestsOpened: number;
  metamorphoses: number;
  flawless: number;
  itemsBroken: number;
}
